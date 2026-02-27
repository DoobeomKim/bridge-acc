#!/usr/bin/env node
// 패스워드 해시 생성 스크립트
// 사용법: node scripts/hash-password.js
// 또는:   node scripts/hash-password.js "내패스워드"

const bcrypt = require('bcryptjs')
const readline = require('readline')

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 12)
  console.log('\n✅ 아래 값을 .env 파일에 추가하세요:\n')
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`)
  console.log('\n⚠️  패스워드 원문은 저장하지 마세요.\n')
}

const arg = process.argv[2]

if (arg) {
  hashPassword(arg)
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.question('패스워드 입력: ', (password) => {
    rl.close()
    if (!password) {
      console.error('패스워드를 입력해주세요.')
      process.exit(1)
    }
    hashPassword(password)
  })
}
