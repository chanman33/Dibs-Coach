"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num))
}

const calculateTax = (income: number) => {
  const selfEmploymentTax = income * 0.153

  // 2023 tax brackets (simplified for example)
  const brackets = [
    { limit: 11000, rate: 0.1 },
    { limit: 44725, rate: 0.12 },
    { limit: 95375, rate: 0.22 },
    { limit: 182100, rate: 0.24 },
    { limit: 231250, rate: 0.32 },
    { limit: 578125, rate: 0.35 },
    { limit: Number.POSITIVE_INFINITY, rate: 0.37 },
  ]

  let remainingIncome = income
  let incomeTax = 0

  for (const bracket of brackets) {
    if (remainingIncome > 0) {
      const taxableInThisBracket = Math.min(remainingIncome, bracket.limit)
      incomeTax += taxableInThisBracket * bracket.rate
      remainingIncome -= taxableInThisBracket
    } else {
      break
    }
  }

  return selfEmploymentTax + incomeTax
}

export default function RealtorIncomeCalculator() {
  const [transactions, setTransactions] = useState(10)
  const [propertyValue, setPropertyValue] = useState(300000)
  const [commissionRate, setCommissionRate] = useState(3)
  const [brokerageFeeRate, setBrokerageFeeRate] = useState(20)
  const [marketingExpenses, setMarketingExpenses] = useState(1000)
  const [includeTaxes, setIncludeTaxes] = useState(false)
  const [view, setView] = useState('monthly')

  const grossCommission = transactions * propertyValue * (commissionRate / 100)
  const brokerageFees = grossCommission * (brokerageFeeRate / 100)
  const annualGrossIncome = grossCommission - brokerageFees
  const monthlyGrossIncome = annualGrossIncome / 12
  const annualExpenses = marketingExpenses * 12
  const monthlyExpenses = marketingExpenses
  const annualNetIncomeBeforeTax = annualGrossIncome - annualExpenses
  const monthlyNetIncomeBeforeTax = annualNetIncomeBeforeTax / 12

  const annualTaxes = includeTaxes ? calculateTax(annualNetIncomeBeforeTax) : 0
  const monthlyTaxes = annualTaxes / 12
  const annualNetIncomeAfterTax = annualNetIncomeBeforeTax - annualTaxes
  const monthlyNetIncomeAfterTax = annualNetIncomeAfterTax / 12

  // Generate data for the chart
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: view === 'monthly' ? monthlyGrossIncome : grossCommission,
    brokerageFees: view === 'monthly' ? brokerageFees / 12 : brokerageFees,
    expenses: view === 'monthly' ? monthlyExpenses : annualExpenses,
    taxes: includeTaxes ? (view === 'monthly' ? monthlyTaxes : annualTaxes) : 0,
    netIncome: view === 'monthly' 
      ? (includeTaxes ? monthlyNetIncomeAfterTax : monthlyNetIncomeBeforeTax)
      : (includeTaxes ? annualNetIncomeAfterTax : annualNetIncomeBeforeTax),
  }))

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Realtor Income Calculator</CardTitle>
        <CardDescription>Forecast your monthly and annual income based on your transactions and fees</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="transactions">Number of Transactions per Year</Label>
            <Input
              id="transactions"
              type="number"
              value={transactions}
              onChange={(e) => setTransactions(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="propertyValue">Average Property Value</Label>
            <Input
              id="propertyValue"
              type="number"
              value={propertyValue}
              onChange={(e) => setPropertyValue(Number(e.target.value))}
              className="font-mono"
            />
            <span className="text-sm text-muted-foreground mt-1">{formatNumber(propertyValue)}</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Slider
              id="commissionRate"
              min={0}
              max={10}
              step={0.1}
              value={[commissionRate]}
              onValueChange={(value) => setCommissionRate(value[0])}
            />
            <span className="text-sm text-muted-foreground">{commissionRate.toFixed(1)}%</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brokerageFeeRate">Brokerage Fee Rate (%)</Label>
            <Slider
              id="brokerageFeeRate"
              min={0}
              max={50}
              step={1}
              value={[brokerageFeeRate]}
              onValueChange={(value) => setBrokerageFeeRate(value[0])}
            />
            <span className="text-sm text-muted-foreground">{brokerageFeeRate}%</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="marketingExpenses">Monthly Marketing Expenses</Label>
            <Input
              id="marketingExpenses"
              type="number"
              value={marketingExpenses}
              onChange={(e) => setMarketingExpenses(Number(e.target.value))}
              className="font-mono"
            />
            <span className="text-sm text-muted-foreground mt-1">{formatNumber(marketingExpenses)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="include-taxes" checked={includeTaxes} onCheckedChange={setIncludeTaxes} />
            <Label htmlFor="include-taxes">Include Tax Calculations</Label>
          </div>
        </div>

        <Tabs defaultValue="monthly" className="mt-6" onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <div className="grid gap-2 mt-4">
              <p>Gross Commission: {formatNumber(grossCommission / 12)}</p>
              <p>Brokerage Fees: {formatNumber(brokerageFees / 12)}</p>
              <p>Gross Income: {formatNumber(monthlyGrossIncome)}</p>
              <p>Expenses: {formatNumber(monthlyExpenses)}</p>
              <p className={!includeTaxes ? "font-bold" : ""}>Net Income (Before Tax): {formatNumber(monthlyNetIncomeBeforeTax)}</p>
              {includeTaxes && (
                <>
                  <p>Estimated Taxes: {formatNumber(monthlyTaxes)}</p>
                  <p className="font-bold">Net Income (After Tax): {formatNumber(monthlyNetIncomeAfterTax)}</p>
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="annual">
            <div className="grid gap-2 mt-4">
              <p>Gross Commission: {formatNumber(grossCommission)}</p>
              <p>Brokerage Fees: {formatNumber(brokerageFees)}</p>
              <p>Gross Income: {formatNumber(annualGrossIncome)}</p>
              <p>Expenses: {formatNumber(annualExpenses)}</p>
              <p className={!includeTaxes ? "font-bold" : ""}>Net Income (Before Tax): {formatNumber(annualNetIncomeBeforeTax)}</p>
              {includeTaxes && (
                <>
                  <p>Estimated Taxes: {formatNumber(annualTaxes)}</p>
                  <p className="font-bold">Net Income (After Tax): {formatNumber(annualNetIncomeAfterTax)}</p>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Income Projection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#8884d8" name="Gross Income" />
              <Line type="monotone" dataKey="brokerageFees" stroke="#ff8042" name="Brokerage Fees" />
              <Line type="monotone" dataKey="expenses" stroke="#82ca9d" name="Marketing Expenses" />
              {includeTaxes && <Line type="monotone" dataKey="taxes" stroke="#e74c3c" name="Estimated Taxes" />}
              <Line
                type="monotone"
                dataKey="netIncome"
                stroke="#ffc658"
                name={includeTaxes ? "Net Income (After Tax)" : "Net Income (Before Tax)"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

