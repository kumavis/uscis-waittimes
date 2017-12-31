'use strict'

const fs = require('fs')
const request = require('request').defaults({ jar: true })
const { JSDOM } = require('jsdom')
const pify = require('pify')
const asyncq = require('async-q')
const mkdirp = require('mkdirp')
const offices = require('./offices.json')
const month = (1000 * 60 * 60 * 24 * 30) // in ms


// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

start().then(console.log, console.error)

async function start(){
  // intialization
  await getCookie()
  // perform lookups
  const waitTimes = await asyncq.mapSeries(offices, lookupOffice)
  console.log('waitTimes', waitTimes)
  await recordAll({ waitTimes, offices })
}

async function recordAll({ waitTimes, offices }) {
  const now = new Date()
  const nowString = now.toDateString()

  const labels = offices.map(office => office.name)
  labels.unshift(`"Date Recorded"`)
  labels.push(`\n`)
  const labelString = labels.join(',')

  const data = waitTimes.slice()
  data.unshift(nowString)
  data.push(`\n`)
  const dataString = data.join(',')

  const filename = `results/_all.csv`
  await pify(mkdirp)('./results')
  if (!fs.existsSync(filename)) {
    await pify(fs.appendFile)(filename, labelString)
  }
  await pify(fs.appendFile)(filename, dataString)
}

async function lookupOffice(officeData){
  const date = await checkCurrentProcessingDate(officeData.id)
  const dateString = date.toDateString()
  const now = new Date()
  const nowString = now.toDateString()
  const waitTime = now - date
  const waitTimeString = (waitTime/month).toFixed(1)
  // console.log('currently processing:', dateString)
  // console.log(`wait time: ${waitTimeString} months`)

  // record individual data
  const labels = `"Date Recorded","Currently Processing", "Wait Time (months)"\n`
  const dataLine = `"${nowString}","${dateString}","${waitTimeString}"\n`
  const filename = `results/${officeData.name}.csv`
  await pify(mkdirp)('./results')
  if (!fs.existsSync(filename)) {
    await pify(fs.appendFile)(filename, labels)
  }
  await pify(fs.appendFile)(filename, dataLine)
  console.log(`recorded data for "${officeData.name}"`)


  return waitTimeString

  // const filedDate = new Date('March 25 2017')
  // const ETA = new Date(filedDate.getTime() + waitTime)
  // const remainingWaitTime = ETA - now
  // const remainingWaitTimeString = (remainingWaitTime / month).toFixed(1)
  // console.log(`Estimates for application filed at "${filedDate.toDateString()}":`)
  // console.log(`  Estimated Date: "${ETA.toDateString()}"`)
  // console.log(`  Remaining wait time: ${remainingWaitTimeString} months`)
}

function getCookie() {
  return new Promise((resolve, reject) => {
    request.post({
      url: 'https://egov.uscis.gov/cris/processTimesDisplayInit.do',
      timeout: 45000
    }, (err, res, body) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function checkCurrentProcessingDate (officeId) {
  return new Promise((resolve, reject) => {
    request.post({
      url: 'https://egov.uscis.gov/cris/processingTimesDisplay.do',
      form: {
        officeId,
        displayLOProcTimes: 'Field Office Processing Dates',
      },
      timeout: 45000
    }, (err, res, body) => {
      if (err) return reject(err)
      const { window } = new JSDOM(body)
      let dom = window.document.querySelector('table#ptResults > tbody > tr:nth-child(2) > td:nth-child(3)')
      const dateString = dom.textContent.trim()
      const date = new Date(dateString)
      resolve(date)
    })
  })
}