$assistantMarkup = @'
  <div class="site-assistant" data-site-assistant>
    <button class="site-assistant__toggle" type="button" data-site-assistant-toggle aria-expanded="false" aria-controls="site-assistant-panel">
      <span class="site-assistant__toggle-mark">AI</span>
      <span class="site-assistant__toggle-copy">
        <strong>Portfolio Assistant</strong>
        <span>Ask about experience, projects, or where to look.</span>
      </span>
    </button>
    <div class="site-assistant__panel" id="site-assistant-panel" data-site-assistant-panel hidden>
      <div class="site-assistant__header">
        <div>
          <p class="site-assistant__eyebrow">Portfolio</p>
          <p class="site-assistant__title">Portfolio Assistant</p>
          <p class="site-assistant__subcopy">Ask questions about the work, projects, or how to get in touch.</p>
        </div>
        <button class="site-assistant__close" type="button" data-site-assistant-close aria-label="Close portfolio assistant">x</button>
      </div>
      <div class="site-assistant__frame-wrap">
        <iframe class="site-assistant__frame" title="Portfolio Assistant" data-site-assistant-frame data-src="portfolio-assistant.html" loading="lazy"></iframe>
      </div>
    </div>
  </div>
'@

$files = Get-ChildItem -Path . -Filter *.html -File | Where-Object { $_.Name -notin @('widget.html','portfolio-assistant.html') }
$updated = 0

foreach ($file in $files) {
  $content = Get-Content -Raw $file.FullName

  if ($content -match 'data-site-assistant') {
    continue
  }

  if ($content -notmatch 'assistant.css') {
    $content = $content -replace '(?i)</head>', "  <link rel=`"stylesheet`" href=`"assistant.css`" />`r`n</head>"
  }

  if ($content -notmatch 'assistant.js') {
    $content = $content -replace '(?i)</body>', "  <script src=`"assistant.js`"></script>`r`n</body>"
  }

  $content = $content -replace '(?i)(<body[^>]*>)', "`$1`r`n$assistantMarkup"
  Set-Content -Path $file.FullName -Value $content
  $updated++
}

Write-Host "Updated files:" $updated
