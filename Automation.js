//node Automation.js --url="https://www.hackerrank.com" --config=config.json

//npm init -y
//npm install puppeteer
//npm install minimist

let minimist = require("minimist");
let puppeteer = require("puppeteer");
let args = minimist(process.argv);
let fs = require("fs");

// now to need to open the browser and click on the first page
let configJSON = fs.readFileSync(args.config);
let configJSO = JSON.parse(configJSON);

async function run()
{
	//start/open the browser
	let browser = await puppeteer.launch({
defaultViewport : null,
args: [
		    "--start-maximized" //full screen
		],
headless: false
	})

	//get a tab
	let pages = await browser.pages();
	let page = pages[0];

	//go to url
	await page.goto(args.url);

	//click on login on page 1
	await page.waitForSelector("a[data-event-action='Login']");
	await page.click("a[data-event-action='Login']");

	//click on login on page 2
	await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
	await page.click("a[href='https://www.hackerrank.com/login']");

	//type username/userid on page 3
	await page.waitForSelector("input[name='username']");
	await page.type("input[name='username']", configJSO.userid, {delay: 40});

	//type password on page 3
	await page.waitForSelector("input[name='password']");
	await page.type("input[name='password']", configJSO.password, {delay: 40});
	await page.waitFor(3000);

	//click on login on page 3
	await page.waitForSelector("button[data-analytics='LoginPassword']");
	await page.waitFor(3000);
	await page.click("button[data-analytics='LoginPassword']");
	await page.waitFor(3000);

	//click on compete after successful logging in
	await page.waitForSelector("a[data-analytics='NavBarContests']");
	await page.click("a[data-analytics='NavBarContests']");
	await page.waitFor(3000);

	//click on manage contests
	await page.waitForSelector("a[href='/administration/contests/']");
	await page.click("a[href='/administration/contests/']");

	//need to check how many pages of contest we have in manage
	await page.waitFor(3000);
	await page.waitForSelector("a[data-attr1='Last']");
	let numPages = await page.$eval("a[data-attr1='Last']", function(lastTag)
	{
		let numpages = parseInt(lastTag.getAttribute('data-page'));
		return numpages;

	});

	await page.waitFor(3000);

	await page.waitFor(3000);
	for (let i = 0; i < numPages; i++)     //all pages
	{
		await handlePage(browser, page);
	}
}



//now we will handle the code for adding moderators in all contest of a page
async function handlePage(browser, page) {
	await page.waitForSelector("a.backbone.block-center");

	let curls = await page.$$eval("a.backbone.block-center", function(atags) { //curls mtlb contest url
		let iurls = []; //inner urls
		for (let i = 0; i < atags.length; i++)
		{
			let url = atags[i].getAttribute("href");
			iurls.push(url);
		}
		return iurls;
	});

	console.log(curls); 
	for (let i = 0; i < curls.length; i++){
		await handlecontest(browser, page, curls[i]);
	}

	//to move on the next page
	await page.waitFor(1500);
	await page.waitForSelector("a[data-attr1='Right']");
	await page.click("a[data-attr1='Right']");
	await page.waitFor(2000);

}

async function handlecontest(browser, page, curl)
{
	let npage = await browser.newPage();
	await npage.goto(args.url + curl);
	await npage.waitFor(2000);

  //click on moderators tab
	await npage.waitForSelector("li[data-tab='moderators']");
	await npage.click("li[data-tab='moderators']");
	await npage.waitFor(2000);

  //type the moderator ids
	for (let i = 0; i < configJSO.moderators.length; i++)
	{
		let moderator = configJSO.moderators[i];
		await npage.waitForSelector("input#moderator");
		await npage.type("input#moderator", moderator, {delay: 50});
		await npage.waitFor(2000);

  //now we need to press enter to save the moderator
		await npage.keyboard.press("Enter");
		await npage.waitFor(2000);
	}

  //close the current contest to continue the loop for all contest of all pages
	await npage.close();
	await page.waitFor(2000);

}