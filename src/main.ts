import axios from "axios";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

async function scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
  });

  let currentPage = 1;
  let productData: any[] = [];

  while (true) {
    const url = `https://www.atacadobrandcollection.com/masculino?pagina=${currentPage}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const hasProducts = await page.evaluate(() => {
      const products = document.querySelectorAll("#listagemProdutos > ul");
      return products.length > 0;
    });
    
    if (!hasProducts) {
      break;
    }

    const links: string[] = await page.evaluate(() => {
      const elements = document.querySelectorAll("#listagemProdutos > ul > div > div > a");
      return Array.from(elements)
        .map(el => el.getAttribute("href"))
        .filter((link): link is string => link !== null);
    });

    for (let link of links) {
      try {
        
        console.log(link)

        await page.goto(link, { waitUntil: "domcontentloaded" });

        await page.waitForSelector("#corpo > div.secao-principal.row-fluid.sem-coluna > div > div.produto-detalhes > div > div > div.produto-detalhes-detalhes > div > div.info-principal-produto > h1", { visible: true });

        const productInfo = await page.evaluate(() => {
          const title = document.querySelector<any>("#corpo > div.secao-principal.row-fluid.sem-coluna > div > div.produto-detalhes > div > div > div.produto-detalhes-detalhes > div > div.info-principal-produto > h1")?.innerText.trim() || "Sem título";
          const price = document.querySelector<any>("#corpo > div.secao-principal.row-fluid.sem-coluna > div > div.produto-detalhes > div > div > div.produto-detalhes-detalhes > div > div > div.precos-wrap > div > div:nth-child(1) > strong")?.innerText.trim() || "Sem preço";
          const description = document.querySelector<any>("#descricao")?.innerText.trim() || "Sem descrição";
      
          return { title, price, description };
        });
            
        productData.push({ url: link, ...productInfo });

        const imageUrl = await page.evaluate((selector) => {
          const imgElement: any = document.querySelector(selector);
          return imgElement ? imgElement.src : null;
        }, '#imagemProduto');
        
        if (imageUrl) {
          const imageName = path.basename(new URL(imageUrl).pathname);
          const productFolder = path.join("./images", productInfo.title);
        
          if (!fs.existsSync(productFolder)) {
            fs.mkdirSync(productFolder, { recursive: true });
          }
        
          const outputPath = path.join(productFolder, imageName);
        
          await downloadImage(imageUrl, outputPath);
        }

      } catch (error) {
        console.log(error)
      }
    }      

    currentPage++;
  }

  await browser.close();
}

async function downloadImage(imageUrl: string, outputPath: string) {
  const response = await axios({
    url: imageUrl,
    responseType: "stream",
  });
  
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on("finish", () => resolve(undefined));
    writer.on("error", reject);
  });
}

scrape();
