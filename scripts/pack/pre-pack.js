const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execSync } = require('child_process')
const minimatch = require('minimatch')
const recursive = require('recursive-readdir')
const projectRoot = path.join(__dirname, '../../')

// Generate a unique hash for the pre-pack directory
const uniqueHash = crypto.randomBytes(8).toString('hex')
const date = new Date()
const formattedDate = date.toISOString().replace(/[-:]/g, '').split('.')[0]
const prePackDir = path.join(projectRoot, `.pre-pack-${uniqueHash}-${formattedDate}`)

const distZip = path.join(projectRoot, 'dist/app.zip')
const distZipRoot = path.join(projectRoot, 'dist/app.zip')
const additionalExcludes = [
  '.gitignore',
  'docs',
  '.pre-pack-*',
  '.git',
  '.env' // This excludes only `.env`, not `env.dist`
]

const forceIncludes = [
  'node_modules',
  '.aio'
]

const getPatternsFromFile = (path) => {
  if (fs.existsSync(path)) {
    const gitignoreContent = fs.readFileSync(path, 'utf-8')
    return gitignoreContent.split('\n').filter(line => line && !line.startsWith('#'))
  }
  return []
}

const drawProgressBar = (progress) => {
  const barWidth = 30
  const filledWidth = Math.floor(progress / 100 * barWidth)
  const emptyWidth = barWidth - filledWidth
  const progressBar = '█'.repeat(filledWidth) + '▒'.repeat(emptyWidth)
  return `[${progressBar}] ${progress}%`
}

const getAllFiles = async (dir, { includes, excludes }) => {
  return recursive(dir, [(file, stats) => {
    const isExcluded = excludes.some(pattern => minimatch(path.basename(file), pattern))
    const isIncluded = includes.some(pattern => minimatch(path.basename(file), pattern))
    if (isExcluded && !isIncluded) {
      return true
    }
    return false
  }])
}

const copyFileSync = async (src, dest, rules) => {
  const files = await getAllFiles(src, rules)
  const totalFiles = files.length
  const startTime = Date.now()
  const errors = []
  let copiedFiles = 0

  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(`Copying files: ${drawProgressBar(0)} (${copiedFiles}/${totalFiles}) - ETA: ${0}s`)

  fs.mkdir(dest, { recursive: true }, (err) => {
    if (err) {
      console.error(`Error creating directory: ${err.message}`)
    }
  })

  files.forEach(file => {
    const relativePath = path.relative(projectRoot, file)
    const destFile = path.join(prePackDir, relativePath)
    fs.mkdirSync(path.dirname(destFile), { recursive: true })
    try {
      fs.copyFileSync(file, destFile)
    } catch (err) {
      errors.push(err.message)
    } finally {
      copiedFiles++

      const progress = Math.round((copiedFiles / totalFiles) * 100)
      const elapsedTime = (Date.now() - startTime) / 1000 // in seconds
      const estimatedTotalTime = (elapsedTime / copiedFiles) * totalFiles
      const remainingTime = estimatedTotalTime - elapsedTime

      process.stdout.clearLine()
      process.stdout.cursorTo(0)
      process.stdout.write(`Assesing files: ${drawProgressBar(progress)} (${copiedFiles}/${totalFiles}) - ETA: ${remainingTime.toFixed(2)}s`)
    }
  })
  process.stdout.write('\n')
  if (errors.length > 0) {
    console.error(`\nErrors occurred during copying:\n - ${errors.join('\n - ')}`)
  }
  process.stdout.write('\n')
}

copyFileSync(
  projectRoot,
  prePackDir,
  {
    includes: [...forceIncludes],
    excludes: [
      ...additionalExcludes,
      ...getPatternsFromFile(path.join(projectRoot, '.gitignore'))
    ]
  }
).then(() => {
  process.stdout.write('✔ Assessing files completed.\n')
  execSync(`${projectRoot}/node_modules/@adobe/aio-cli/bin/run app pack `, {
    cwd: prePackDir,
    stdio: 'inherit'
  })
}).then(() => {
  process.stdout.write('✔ Packing files completed.\n')
  if (distZipRoot === distZip) {
    fs.rmSync(distZipRoot, { recursive: true, force: true })
  }
  fs.mkdirSync(path.dirname(distZipRoot), { recursive: true })
  fs.copyFileSync(
    path.join(prePackDir, 'dist/app.zip'),
    distZipRoot
  )
  fs.rmSync(prePackDir, { recursive: true, force: true })
  process.stdout.write('✔ Pre-pack completed successfully.\n')
}).finally(() => {
  fs.rmSync(prePackDir, { recursive: true, force: true })
  process.stdout.write('✔ Cleaned up temporary files.\n')
}).catch((error) => {
  console.error('Error during pre-pack:', error)
  throw error
})
