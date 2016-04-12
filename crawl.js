require('babel-polyfill')
const cheerio = require('cheerio')
const requester = require('gw2e-requester')

async function main () {
  let ids = await getIds()
  let rows = []

  for (let key in ids) {
    rows.push(await getForId(ids[key]))
  }

  console.log(rows.join('\n'))
}

// Get all ids for the discipline
async function getIds () {
  let items = await requester.single('http://bddatabase.net/query.php?a=recipes&type=alchemy&l=us&_=1460454030700')
  items = items.aaData
  items = items.map(item => JSON.parse(item[0]))
  return items
}

// Go through the data of a single id and build a row out of it
async function getForId (id) {
  let url = 'http://bddatabase.net/tip.php?id=recipe--' + id + '&l=us&nf=on'
  let content = await requester.single(url, {type: 'text'})
  let cells = []

  let $ = cheerio.load(content)
  let body = $('.insider table tr')

  // Push result: amount, image & text
  cells.push(1)
  cells.push('=IMAGE("http://bddatabase.net/' + body.eq(3).find('img').attr('src') + '")')
  cells.push(body.eq(1).find('b').text())

  // Go through components
  let components = body.eq(4).find('td').html().split('<br>')
  components.shift()
  components.map(c => {
    let $c = cheerio.load(c)

    // Push component: amount, image & text
    cells.push($c('.quantity_small').text() || 1)
    cells.push('=IMAGE("http://bddatabase.net/' + $c('img').attr('src') + '")')
    cells.push($c('.qtooltip').eq(1).text())
  })

  return cells.join('\t')
}

main()
