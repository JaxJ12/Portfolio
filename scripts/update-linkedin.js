/**
 * update-linkedin.js
 * ──────────────────
 * Fetches the latest posts from the LinkedIn API and merges them
 * into linkedin-posts.json without overwriting existing entries.
 *
 * Called by: .github/workflows/update-linkedin.yml
 * Requires env vars: LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_ID
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN     = process.env.LINKEDIN_ACCESS_TOKEN;
const PERSON_ID = process.env.LINKEDIN_PERSON_ID;
const JSON_PATH = path.join(__dirname, "..", "linkedin-posts.json");

if (!TOKEN || !PERSON_ID) {
  console.error("❌ Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_ID env vars.");
  console.error("   Add them as GitHub Secrets in your repo settings.");
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`LinkedIn API ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    }).on("error", reject);
  });
}

function timeAgo(dateStr) {
  const posted = new Date(dateStr);
  const diffDays = Math.round((Date.now() - posted) / (1000 * 60 * 60 * 24));
  if (diffDays < 1)  return "Today";
  if (diffDays < 7)  return `${diffDays}d`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)}w`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)}mo`;
  return `${Math.round(diffDays / 365)}y`;
}

// ── Transform raw LinkedIn API post → portfolio format ───────────────────────

function transformPost(e) {
  // LinkedIn REST API (v202304+) shape, with UGC Posts API fallback.
  // Reposts have a resharedPost or repost field — handle both shapes.

  const isRepost = !!(
    e.repost ||
    e.resharedPost ||
    e.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareMediaCategory === "NONE" && e.commentary === undefined
  );

  // The user's own commentary on the repost (can be empty for pure reposts)
  const commentary =
    e.commentary ||
    e.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text ||
    "";

  // Original post text (for reposts)
  const originalText =
    e.repost?.commentary ||
    e.resharedPost?.commentary ||
    e.repost?.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text ||
    "";

  // Display text: own commentary first, fall back to original post text
  const text = commentary || originalText;

  const tsMs = e.publishedAt ?? e.createdAt ?? e.created?.time ?? Date.now();
  const date = new Date(tsMs).toISOString().split("T")[0];

  const words    = text.split(/\s+/);
  const hashtags = words.filter((w) => w.startsWith("#"));

  const reactions =
    e.socialDetail?.totalSocialActivityCounts?.numLikes ??
    e.likesSummary?.totalLikes ??
    0;

  const comments =
    e.socialDetail?.totalSocialActivityCounts?.numComments ??
    e.commentsSummary?.totalFirstLevelComments ??
    0;

  return {
    id:            e.id,
    date,
    dateLabel:     timeAgo(date),
    text,
    commentary,
    isRepost,
    originalText:  isRepost ? originalText : undefined,
    hashtags,
    reactions,
    reactionTypes: reactions > 0 ? "👍❤️" : "👍",
    comments,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍 Fetching LinkedIn posts for person:", PERSON_ID);

  const headers = {
    Authorization:    `Bearer ${TOKEN}`,
    "LinkedIn-Version": "202404",
    "X-Restli-Protocol-Version": "2.0.0",
  };

  // Try the newer REST Posts API first, fall back to UGC Posts API
  let elements = [];
  try {
    const url = `https://api.linkedin.com/rest/posts?author=urn:li:person:${PERSON_ID}&q=author&count=20&sortBy=LAST_MODIFIED`;
    const data = await httpsGet(url, headers);
    elements = data.elements || [];
    console.log(`✅ REST API returned ${elements.length} posts.`);
  } catch (err) {
    console.warn("⚠️  REST Posts API failed, trying UGC Posts API:", err.message);
    try {
      const ugcUrl = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${PERSON_ID})&count=10&sortBy=LAST_MODIFIED`;
      const data = await httpsGet(ugcUrl, {
        ...headers,
        "LinkedIn-Version": undefined,
      });
      elements = data.elements || [];
      console.log(`✅ UGC API returned ${elements.length} posts.`);
    } catch (ugcErr) {
      console.error("❌ Both LinkedIn APIs failed:", ugcErr.message);
      console.error("   Check that your access token is valid and has r_member_social scope.");
      process.exit(1);
    }
  }

  // Load existing posts
  let existing = [];
  if (fs.existsSync(JSON_PATH)) {
    existing = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  }

  const existingIds = new Set(existing.map((p) => p.id));

  // Only add posts that aren't already in the file
  const newPosts = elements
    .filter((e) => e.id && !existingIds.has(e.id))
    .map(transformPost)
    .filter((p) => p.text.trim().length > 0 || p.isRepost); // keep reposts even if no added commentary

  if (newPosts.length === 0) {
    console.log("📭 No new posts found — feed is already up to date.");
  } else {
    console.log(`📬 Found ${newPosts.length} new post(s) — adding to feed.`);
    newPosts.forEach((p) => console.log(`   • [${p.date}] ${p.text.slice(0, 60)}…`));
  }

  // Newest posts first
  const merged = [...newPosts, ...existing];
  fs.writeFileSync(JSON_PATH, JSON.stringify(merged, null, 2));
  console.log(`💾 Saved ${merged.length} total posts to linkedin-posts.json`);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
