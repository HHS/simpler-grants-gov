module.exports = {
  "defaults": {
    "timeout": 120000,
    "useIncognitoBrowserContext": false,
    "runners": [
      "axe"
    ],
    "chromeLaunchConfig": {
      "args": [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    },
    "actions": [
      "navigate to http://localhost:3000/api/user/local-quick-login?jwt=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MDJlNWQyYi04MTVjLTRiMjUtYjhmOC00MjgyZjYwYWY0NjYiLCJpYXQiOjE3Njg1MDM3MzIsImF1ZCI6InNpbXBsZXItZ3JhbnRzLWFwaSIsImlzcyI6InNpbXBsZXItZ3JhbnRzLWFwaSIsImVtYWlsIjpudWxsLCJ1c2VyX2lkIjoiN2VkYjU3MDQtOWQzYi00MDk5LTllMTAtZmJiOWYyNzI5YWZmIiwic2Vzc2lvbl9kdXJhdGlvbl9taW51dGVzIjoxNTc2ODAwMH0.O7-Y2t5ykQ08Z7ffHiH7NPsa5PbB_jvmjPY5D-LJ4FY6zG4DQH3S3VJ1X_4X-O_GbtwqcNhfHYk3pPCccymL5OaZNm-NKUu9btm9pft7koWGmNmUhzS4sQhF1s-Ugw1P7x7XpDCpq18zGHCjcdCR5-lWPGgcz6nd11m_kwQw5sZSku8elSwxZXMPu16_Ya3p0-5rmvZaARS-VGgyMpVSKcqdheM2Jfiad-rdrbJGPHOEA-fmsrYQ6fiH8EDCQza78K7BG5kJ6eAeuVrdPEs5YRWcKUZW4aejiwu-q6YBk15XYn6xAc-gp1uFQh7F1lsotpTgmsqO2IkMTjqUeL9bRA",
      "wait for element body to be visible"
    ]
  },
  "urls": [
    {
      "url": "http://localhost:3000/api-dashboard?_ff=authOn:true",
      "actions": [
        "navigate to http://localhost:3000/api/user/local-quick-login?jwt=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MDJlNWQyYi04MTVjLTRiMjUtYjhmOC00MjgyZjYwYWY0NjYiLCJpYXQiOjE3Njg1MDM3MzIsImF1ZCI6InNpbXBsZXItZ3JhbnRzLWFwaSIsImlzcyI6InNpbXBsZXItZ3JhbnRzLWFwaSIsImVtYWlsIjpudWxsLCJ1c2VyX2lkIjoiN2VkYjU3MDQtOWQzYi00MDk5LTllMTAtZmJiOWYyNzI5YWZmIiwic2Vzc2lvbl9kdXJhdGlvbl9taW51dGVzIjoxNTc2ODAwMH0.O7-Y2t5ykQ08Z7ffHiH7NPsa5PbB_jvmjPY5D-LJ4FY6zG4DQH3S3VJ1X_4X-O_GbtwqcNhfHYk3pPCccymL5OaZNm-NKUu9btm9pft7koWGmNmUhzS4sQhF1s-Ugw1P7x7XpDCpq18zGHCjcdCR5-lWPGgcz6nd11m_kwQw5sZSku8elSwxZXMPu16_Ya3p0-5rmvZaARS-VGgyMpVSKcqdheM2Jfiad-rdrbJGPHOEA-fmsrYQ6fiH8EDCQza78K7BG5kJ6eAeuVrdPEs5YRWcKUZW4aejiwu-q6YBk15XYn6xAc-gp1uFQh7F1lsotpTgmsqO2IkMTjqUeL9bRA",
        "wait for element body to be visible",
        "navigate to http://localhost:3000/api-dashboard?_ff=authOn:true",
        "wait for element main to be visible",
        "screen capture screenshots-output/api-dashboard.png"
      ]
    },
    {
      "url": "http://localhost:3000/vision?_ff=authOn:true",
      "actions": [
        "navigate to http://localhost:3000/api/user/local-quick-login?jwt=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MDJlNWQyYi04MTVjLTRiMjUtYjhmOC00MjgyZjYwYWY0NjYiLCJpYXQiOjE3Njg1MDM3MzIsImF1ZCI6InNpbXBsZXItZ3JhbnRzLWFwaSIsImlzcyI6InNpbXBsZXItZ3JhbnRzLWFwaSIsImVtYWlsIjpudWxsLCJ1c2VyX2lkIjoiN2VkYjU3MDQtOWQzYi00MDk5LTllMTAtZmJiOWYyNzI5YWZmIiwic2Vzc2lvbl9kdXJhdGlvbl9taW51dGVzIjoxNTc2ODAwMH0.O7-Y2t5ykQ08Z7ffHiH7NPsa5PbB_jvmjPY5D-LJ4FY6zG4DQH3S3VJ1X_4X-O_GbtwqcNhfHYk3pPCccymL5OaZNm-NKUu9btm9pft7koWGmNmUhzS4sQhF1s-Ugw1P7x7XpDCpq18zGHCjcdCR5-lWPGgcz6nd11m_kwQw5sZSku8elSwxZXMPu16_Ya3p0-5rmvZaARS-VGgyMpVSKcqdheM2Jfiad-rdrbJGPHOEA-fmsrYQ6fiH8EDCQza78K7BG5kJ6eAeuVrdPEs5YRWcKUZW4aejiwu-q6YBk15XYn6xAc-gp1uFQh7F1lsotpTgmsqO2IkMTjqUeL9bRA",
        "wait for element body to be visible",
        "navigate to http://localhost:3000/vision?_ff=authOn:true",
        "wait for element main to be visible",
        "screen capture screenshots-output/vision.png"
      ]
    }
  ]
};