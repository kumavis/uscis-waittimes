const month = (1000 * 60 * 60 * 24 * 30) // in ms
const filedDate = new Date('March 25 2017')

const date = new Date('Tue Jan 03 2017')
const now = new Date()
const waitTime = now - date

const ETA = new Date(filedDate.getTime() + waitTime)
const remainingWaitTime = ETA - now
const remainingWaitTimeString = (remainingWaitTime / month).toFixed(1)
console.log(`Estimates for application filed at "${filedDate.toDateString()}":`)
console.log(`  Estimated Date: "${ETA.toDateString()}"`)
console.log(`  Remaining wait time: ${remainingWaitTimeString} months`)