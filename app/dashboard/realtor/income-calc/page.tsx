"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Cell } from "recharts"
import { ResponsiveSankey } from '@nivo/sankey'

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

  // Add this helper function for the waterfall chart data
  const getWaterfallData = (isMonthly: boolean) => {
    const grossIncome = isMonthly ? monthlyGrossIncome : annualGrossIncome;
    const brokerage = isMonthly ? brokerageFees / 12 : brokerageFees;
    const marketing = isMonthly ? monthlyExpenses : annualExpenses;
    const taxes = isMonthly ? monthlyTaxes : annualTaxes;
    
    return [
      { name: 'Gross Income', value: grossIncome, type: 'positive' },
      { name: 'Brokerage Fees', value: -brokerage, type: 'negative' },
      { name: 'Marketing', value: -marketing, type: 'negative' },
      ...(includeTaxes ? [{ name: 'Taxes', value: -taxes, type: 'negative' }] : []),
      { 
        name: 'Net Income', 
        value: isMonthly 
          ? (includeTaxes ? monthlyNetIncomeAfterTax : monthlyNetIncomeBeforeTax)
          : (includeTaxes ? annualNetIncomeAfterTax : annualNetIncomeBeforeTax),
        type: 'total'
      }
    ];
  };

  // Add this helper function for the Sankey diagram data
  const getSankeyData = (isMonthly: boolean) => {
    const grossIncome = isMonthly ? monthlyGrossIncome : annualGrossIncome;
    const brokerage = isMonthly ? brokerageFees / 12 : brokerageFees;
    const marketing = isMonthly ? monthlyExpenses : annualExpenses;
    const taxes = isMonthly ? monthlyTaxes : annualTaxes;
    const netIncome = isMonthly 
      ? (includeTaxes ? monthlyNetIncomeAfterTax : monthlyNetIncomeBeforeTax)
      : (includeTaxes ? annualNetIncomeAfterTax : annualNetIncomeBeforeTax);

    return {
      nodes: [
        { id: 'grossIncome', label: `Gross Income\n${formatNumber(grossIncome)}`, color: '#8884d8' },
        { id: 'brokerageFees', label: `Brokerage Fees\n${formatNumber(brokerage)}`, color: '#ff8042' },
        { id: 'marketing', label: `Marketing\n${formatNumber(marketing)}`, color: '#82ca9d' },
        ...(includeTaxes ? [{ id: 'taxes', label: `Taxes\n${formatNumber(taxes)}`, color: '#e74c3c' }] : []),
        { id: 'netIncome', label: `Net Income\n${formatNumber(netIncome)}`, color: '#ffc658' }
      ],
      links: [
        {
          source: 'grossIncome',
          target: 'brokerageFees',
          value: brokerage
        },
        {
          source: 'grossIncome',
          target: 'marketing',
          value: marketing
        },
        ...(includeTaxes ? [{
          source: 'grossIncome',
          target: 'taxes',
          value: taxes
        }] : []),
        {
          source: 'grossIncome',
          target: 'netIncome',
          value: netIncome
        }
      ]
    };
  };

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

        <div className="mt-8 space-y-8">
          {/* Original Line Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
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
          </div>

          {/* Waterfall and Sankey Charts Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Income Breakdown</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={getWaterfallData(view === 'monthly')}
                    layout="vertical"
                    margin={{ top: 20, right: 20, bottom: 20, left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatNumber} />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value) => formatNumber(Math.abs(Number(value)))} />
                    <Bar dataKey="value" fill="#8884d8">
                      {getWaterfallData(view === 'monthly').map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.type === 'positive' ? '#82ca9d' : entry.type === 'negative' ? '#ff8042' : '#ffc658'}
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Income Flow</h3>
              <div className="h-[400px]">
                <ResponsiveSankey
                  data={getSankeyData(view === 'monthly')}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  align="justify"
                  colors={{ scheme: 'category10' }}
                  nodeOpacity={1}
                  nodeThickness={18}
                  nodeInnerPadding={3}
                  nodeSpacing={24}
                  nodeBorderWidth={0}
                  linkOpacity={0.5}
                  linkHoverOpacity={0.8}
                  enableLinkGradient={true}
                  labelPosition="outside"
                  labelOrientation="horizontal"
                  labelPadding={16}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
                  linkTooltip={({ link }) => {
                    const tooltipLabels = {
                      grossIncome: 'Total Gross Commission',
                      brokerageFees: 'Brokerage Split',
                      marketing: 'Marketing & Advertising',
                      taxes: 'Estimated Tax Liability',
                      netIncome: includeTaxes ? 'Final Take-Home Income' : 'Net Income Before Taxes'
                    };
                    const sourceLabel = tooltipLabels[link.source.id as keyof typeof tooltipLabels];
                    const targetLabel = tooltipLabels[link.target.id as keyof typeof tooltipLabels];
                    return (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px 16px', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontWeight: 600, color: '#1a202c', marginBottom: '4px' }}>
                          Flow: {sourceLabel} → {targetLabel}
                        </div>
                        <div style={{ color: '#4a5568' }}>{formatNumber(link.value)}</div>
                      </div>
                    );
                  }}
                  nodeTooltip={({ node }) => {
                    const tooltipLabels = {
                      grossIncome: 'Total Gross Commission',
                      brokerageFees: 'Brokerage Split',
                      marketing: 'Marketing & Advertising',
                      taxes: 'Estimated Tax Liability',
                      netIncome: includeTaxes ? 'Final Take-Home Income' : 'Net Income Before Taxes'
                    };
                    const value = node.label.split('\n')[1];
                    return (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px 16px', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontWeight: 600, color: '#1a202c', marginBottom: '4px' }}>
                          {tooltipLabels[node.id as keyof typeof tooltipLabels]}
                        </div>
                        <div style={{ color: '#4a5568' }}>{value}</div>
                      </div>
                    );
                  }}
                  animate={true}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

