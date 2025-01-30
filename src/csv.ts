import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";
import fs from "fs";

const sanitizeString = (str: string) => {
    if (!str) return "";
    return str.replace(/"/g, '""'); // Escapa aspas duplas para evitar quebra do CSV
};

export async function openCsv(productInfo: any) {
    try {
        console.log("Começando...");

        const rows: any[] = []; // Armazena as linhas lidas do CSV

        fs.createReadStream("./src/product_template.csv")
            .pipe(parse({ delimiter: ",", from_line: 2 }))
            .on("data", function (row) {
                rows.push(row);
            })
            .on("end", function () {
                console.log("Leitura concluída!");

                productInfo.map((item: any) => {
                    const rowData = [
                        item.title.toLowerCase().replace(/\s+/g, "-"), // Handle (slug)
                        sanitizeString(item.title), // Title
                        sanitizeString(item.description), // Body (HTML)
                        "Meu Vendor", // Vendor
                        "Categoria X", // Product Category
                        "Tipo Y", // Type
                        "Tag1,Tag2", // Tags
                        "TRUE", // Published
                        "Tamanho", // Option1 Name
                        "M", // Option1 Value
                        "", // Option2 Name
                        "", // Option2 Value
                        "", // Option3 Name
                        "", // Option3 Value
                        "SKU123", // Variant SKU
                        "500", // Variant Grams
                        "", // Variant Inventory Tracker
                        "10", // Variant Inventory Qty
                        "continue", // Variant Inventory Policy
                        "manual", // Variant Fulfillment Service
                        `R$ ${item.price}`, // Variant Price
                        "", // Variant Compare At Price
                        "TRUE", // Variant Requires Shipping
                        "TRUE", // Variant Taxable
                        "", // Variant Barcode
                        "", // Image Src
                        "", // Image Position
                        "", // Image Alt Text
                        "FALSE", // Gift Card
                        sanitizeString(item.title), // SEO Title
                        sanitizeString(item.description), // SEO Description
                        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", // Google Shopping Columns
                        "", // Variant Image
                        "kg", // Variant Weight Unit
                        "", // Variant Tax Code
                        "", // Cost per item
                        "", // Price / International
                        "", // Compare At Price / International
                        "active" // Status
                    ];
    
                    // Adicionar a nova linha ao array de linhas existentes
                    rows.push(rowData);
                });
                // Criar a nova linha do produto com os dados passados
                

                // Converter para CSV corretamente
                const csvString = stringify(rows, { quoted: true, delimiter: "," });

                // Escrever o CSV
                fs.writeFileSync("products.csv", csvString, "utf8");

                console.log("Arquivo CSV atualizado com sucesso!");
            })
            .on("error", function (error) {
                console.error("Erro ao ler o CSV:", error);
            });

    } catch (error) {
        console.error("Erro geral:", error);
    }
}
