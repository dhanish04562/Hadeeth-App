[System.Reflection.Assembly]::LoadWithPartialName('System.IO.Compression') | Out-Null

$docPath = 'c:\Users\Dell\Downloads\524-1316 Tamil Unicode Text.docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($docPath)
$entry = $zip.GetEntry('word/document.xml')
$reader = [System.IO.StreamReader]::new($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Close()

# Extract all text between <w:t> tags
$matches = [regex]::Matches($xml, '(?<=<w:t>).*?(?=</w:t>)')
$text = @()
foreach ($match in $matches) {
    $text += $match.Value
}

$text -join "`n"
