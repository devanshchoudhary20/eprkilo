#!/usr/bin/env node
// Writes the CSV fixtures under fixtures/. Run: node scripts/make-fixtures.mjs
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const OUT = join(import.meta.dirname, "..", "fixtures")
mkdirSync(OUT, { recursive: true })

const HEADERS = [
  "Sale Date", "Item Name", "Buyer", "Quantity", "Price", "Coupon Code", "Coupon Details", "Discount Amount",
  "Shipping Discount", "Order Shipping", "Order Sales Tax", "Item Total", "Currency", "Transaction ID", "Listing ID",
  "Date Shipped", "Ship Name", "Ship Address1", "Ship Address2", "Ship City", "Ship State", "Ship Zipcode",
  "Ship Country", "Order ID", "Variations", "Order Type", "Listings Type", "Payment Type", "InPerson Discount",
  "InPerson Location", "VAT Paid by Buyer", "SKU",
]

const quote = (value) => (/[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)

// order id, country, quantity, item total, currency, date shipped, listing id, item name
const ITEMS = [
  ["#1001", "Germany", "1", "$20.00", "USD", "03/04/26", "9001", "Greeting card, blank"],
  ["#1001", "Germany", "2", "$30.00", "USD", "03/04/26", "9002", "Enamel pin"],
  ["#1002", "Germany", "1", "£15.00", "GBP", "03/05/26", "9001", "Greeting card, blank"],
  ["#1003", "France", "1", "$25.00", "USD", "03/06/26", "9003", "Art print A4"],
  ["#1004", "France", "3", "$60.00", "USD", "03/07/26", "9002", "Enamel pin"],
  ["#1005", "Spain", "1", "£12.50", "GBP", "03/08/26", "9001", "Greeting card, blank"],
  ["#1006", "Deutschland", "1", "$18.00", "USD", "03/09/26", "9001", "Greeting card, blank"],
  ["#1007", "Netherlands", "1", "$22.00", "USD", "03/10/26", "9003", "Art print A4"],
  ["#1008", "Ireland", "2", "£40.00", "GBP", "03/11/26", "9002", "Enamel pin"],
  ["#1009", "United States", "1", "$35.00", "USD", "03/12/26", "9003", "Art print A4"],
  ["#1010", "United States", "1", "$28.00", "USD", "03/13/26", "9001", "Greeting card, blank"],
  ["#1011", "United Kingdom", "4", "£80.00", "GBP", "03/14/26", "9002", "Enamel pin"],
  ["#1012", "Schweiz", "1", "$30.00", "USD", "03/15/26", "9003", "Art print A4"],
  ["#1013", "", "1", "$10.00", "USD", "03/16/26", "9001", "Greeting card, blank"],
  ["#1014", "Deutchland", "1", "$16.00", "USD", "03/17/26", "9001", "Greeting card, blank"],
  ["#1015", "Deutchland", "1", "$16.00", "USD", "03/18/26", "9001", "Greeting card, blank"],
  ["#1016", "Lapland", "1", "$9.00", "USD", "03/19/26", "9001", "Greeting card, blank"],
  ["#1017", "France", "", "$14.00", "USD", "03/20/26", "9001", "Greeting card, blank"],
  ["#1018", "Italy", "1", "", "USD", "03/21/26", "9003", "Art print A4"],
  ["#1019", "Germany", "1", "$20.00", "USD", "", "9001", "Greeting card, blank"],
  ["#1020", "Spain", "1", "£10.00", "GBP", "", "9001", "Greeting card, blank"],
  ["#1021", "Austria", "1", "$19.90", "USD", "03/22/26", "9001", "Greeting card, blank"],
  ["#1022", "Poland", "1", "$27.00", "USD", "03/23/26", "9003", "Art print A4"],
  ["#1023", "Belgium", "1", "$21.00", "USD", "03/24/26", "9002", "Enamel pin"],
  ["#1024", "Sweden", "1", "£30.00", "GBP", "03/25/26", "9003", "Art print A4"],
  ["#1025", "Finland", "1", "$12.00", "USD", "soon", "9001", "Greeting card, blank"],
]

const toCsvRows = (items) => items.map(([orderId, country, quantity, total, currency, shipped, listing, name, saleDate = "03/01/26"], index) => {
  const row = Object.fromEntries(HEADERS.map((header) => [header, ""]))
  Object.assign(row, {
    "Sale Date": saleDate, "Item Name": name, Buyer: `Buyer ${index + 1}`, Quantity: quantity, Price: total,
    "Item Total": total, Currency: currency, "Transaction ID": String(5000 + index), "Listing ID": listing,
    "Date Shipped": shipped, "Ship Country": country, "Order ID": orderId, Variations: "Size: A4, Finish: matte",
    "Order Type": "online", "Listings Type": "listing", "Payment Type": "online_cc",
  })
  return HEADERS.map((header) => quote(row[header])).join(",")
})

const bom = "﻿"
writeFileSync(join(OUT, "items.csv"), `${bom}${HEADERS.join(",")}\n${toCsvRows(ITEMS).join("\n")}\n`)

// Sample: USD only, 50 orders, 9 to the EU, one unshipped row, no unrecognised countries.
const SAMPLE_COUNTRIES = [
  ...Array(3).fill("Germany"), ...Array(2).fill("France"), ...Array(2).fill("Netherlands"), "Ireland", "Spain",
  ...Array(28).fill("United States"), ...Array(8).fill("United Kingdom"), ...Array(3).fill("Canada"), ...Array(2).fill("Australia"),
]
const SAMPLE_PRODUCTS = [["9001", "Greeting card, blank", 6], ["9002", "Enamel pin", 12], ["9003", "Art print A4", 24]]
let seed = 7
const next = (limit) => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed % limit
}
const pad = (n) => String(n).padStart(2, "0")
const sampleItems = SAMPLE_COUNTRIES.map((country, index) => {
  const [listing, name, price] = SAMPLE_PRODUCTS[next(3)]
  const quantity = 1 + next(3)
  const shipped = new Date(Date.UTC(2026, 0, 3 + ((index * 5) % 270)))
  const shippedText = `${pad(shipped.getUTCMonth() + 1)}/${pad(shipped.getUTCDate())}/26`
  const unshipped = index === 40
  return [`#${2001 + index}`, country, String(quantity), `$${(price * quantity).toFixed(2)}`, "USD", unshipped ? "" : shippedText, listing, name, shippedText]
})
writeFileSync(join(OUT, "sample-order-items.csv"), `${HEADERS.join(",")}\n${toCsvRows(sampleItems).join("\n")}\n`)

const ordersHeaders = ["Sale Date", "Order ID", "Buyer User ID", "Full Name", "Number of Items", "Payment Type", "Order Value", "Currency", "Ship Country"]
writeFileSync(join(OUT, "orders.csv"), `${ordersHeaders.join(",")}\n03/01/26,1001,77,Ada Buyer,2,online_cc,$50.00,USD,Germany\n`)
writeFileSync(join(OUT, "not-etsy.csv"), "Date,Product,Customer,Amount,Status,Region\n2026-03-01,Mug,Ada,12.00,paid,EU\n")
console.log("fixtures written to", OUT)
