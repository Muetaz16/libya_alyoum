fetch('http://localhost:3000/api/test-news')
  .then(r => r.json())
  .then(d => require('fs').writeFileSync('output2.json', JSON.stringify(d, null, 2)));
