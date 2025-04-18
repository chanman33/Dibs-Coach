"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PrivateCreditLoanType } from "@prisma/client"
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { selectStyles } from "@/components/ui/select-styles"
import { GroupBase } from 'react-select'
import { useMemo, useCallback } from "react"

const privateCreditProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  licenseNumber: z.string().optional(),
  yearsExperience: z.number().min(0).max(100),
  loanTypes: z.array(z.nativeEnum(PrivateCreditLoanType)),
  specializations: z.array(z.string()),
  serviceAreas: z.array(z.string()),
  licensedStates: z.array(z.string()),
  minLoanAmount: z.number().min(0),
  maxLoanAmount: z.number().min(0),
  averageLoanAmount: z.number().min(0),
  monthlyTransactions: z.number().min(0),
  totalLoanVolume: z.number().min(0),
  typicalInterestRate: z.number().min(0),
  averageClosingTime: z.number().min(0),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  bio: z.string().max(1000),
})

type PrivateCreditProfileData = z.infer<typeof privateCreditProfileSchema>

interface PrivateCreditProfileFormProps {
  initialData?: Partial<PrivateCreditProfileData>
  onSubmit: (data: PrivateCreditProfileData) => Promise<void>
  isSubmitting?: boolean
}

export function PrivateCreditProfileForm({
  initialData,
  onSubmit,
  isSubmitting
}: PrivateCreditProfileFormProps) {
  const form = useForm<PrivateCreditProfileData>({
    resolver: zodResolver(privateCreditProfileSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      licenseNumber: initialData?.licenseNumber || "",
      yearsExperience: initialData?.yearsExperience || 0,
      loanTypes: initialData?.loanTypes || [],
      specializations: initialData?.specializations || [],
      serviceAreas: initialData?.serviceAreas || [],
      licensedStates: initialData?.licensedStates || [],
      minLoanAmount: initialData?.minLoanAmount || 0,
      maxLoanAmount: initialData?.maxLoanAmount || 0,
      averageLoanAmount: initialData?.averageLoanAmount || 0,
      monthlyTransactions: initialData?.monthlyTransactions || 0,
      totalLoanVolume: initialData?.totalLoanVolume || 0,
      typicalInterestRate: initialData?.typicalInterestRate || 0,
      averageClosingTime: initialData?.averageClosingTime || 0,
      certifications: initialData?.certifications || [],
      languages: initialData?.languages || [],
      bio: initialData?.bio || "",
    }
  })

  const handleSubmit = async (data: PrivateCreditProfileData) => {
    await onSubmit(data)
  }

  // Memoize the formatGroupLabel function
  const memoizedFormatGroupLabel = useCallback((group: GroupBase<any>) => {
    return (
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="font-semibold text-sm text-slate-700">
          {group.label}
        </span>
      </div>
    );
  }, []);

  // Memoize loan type options
  const loanTypeOptions = useMemo(() => 
    Object.values(PrivateCreditLoanType).map(type => ({
      value: type,
      label: type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    }))
  , []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Number (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearsExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="loanTypes"
            render={({ field: { onChange, value, ...field } }) => {
              const currentValue = useMemo(() => 
                loanTypeOptions.filter(option => value?.includes(option.value))
              , [value]);

              return (
                <FormItem>
                  <FormLabel>Loan Types</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      isMulti
                      options={loanTypeOptions}
                      styles={selectStyles}
                      value={currentValue}
                      onChange={(selected) => {
                        onChange(selected ? selected.map((option: any) => option.value) : []);
                      }}
                      placeholder="Select loan types..."
                      className="w-full"
                      classNamePrefix="loan-type-select"
                      formatGroupLabel={memoizedFormatGroupLabel}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="specializations"
            render={({ field: { onChange, value, ...field } }) => {
              const currentValue = useMemo(() => 
                value?.map(v => ({ value: v, label: v })) || []
              , [value]);

              return (
                <FormItem>
                  <FormLabel>Specializations</FormLabel>
                  <FormControl>
                    <CreatableSelect
                      {...field}
                      isMulti
                      options={currentValue}
                      styles={selectStyles}
                      value={currentValue}
                      onChange={(selected) => {
                        onChange(selected ? selected.map((option: any) => option.value) : []);
                      }}
                      placeholder="Enter specializations..."
                      className="w-full"
                      classNamePrefix="specialization-select"
                      formatGroupLabel={memoizedFormatGroupLabel}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="serviceAreas"
            render={({ field: { onChange, value, ...field } }) => {
              const currentValue = useMemo(() => 
                value?.map(v => ({ value: v, label: v })) || []
              , [value]);

              return (
                <FormItem>
                  <FormLabel>Service Areas</FormLabel>
                  <FormControl>
                    <CreatableSelect
                      {...field}
                      isMulti
                      options={currentValue}
                      styles={selectStyles}
                      value={currentValue}
                      onChange={(selected) => {
                        onChange(selected ? selected.map((option: any) => option.value) : []);
                      }}
                      placeholder="Enter service areas..."
                      className="w-full"
                      classNamePrefix="service-area-select"
                      formatGroupLabel={memoizedFormatGroupLabel}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="licensedStates"
            render={({ field: { onChange, value, ...field } }) => {
              const currentValue = useMemo(() => 
                value?.map(v => ({ value: v, label: v })) || []
              , [value]);

              return (
                <FormItem>
                  <FormLabel>Licensed States</FormLabel>
                  <FormControl>
                    <CreatableSelect
                      {...field}
                      isMulti
                      options={currentValue}
                      styles={selectStyles}
                      value={currentValue}
                      onChange={(selected) => {
                        onChange(selected ? selected.map((option: any) => option.value) : []);
                      }}
                      placeholder="Enter licensed states..."
                      className="w-full"
                      classNamePrefix="licensed-states-select"
                      formatGroupLabel={memoizedFormatGroupLabel}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="minLoanAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Loan Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxLoanAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Loan Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="averageLoanAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Average Loan Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="monthlyTransactions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Transactions</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="totalLoanVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Loan Volume</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="typicalInterestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typical Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="averageClosingTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Average Closing Time (Days)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="certifications"
            render={({ field: { onChange, value, ...field } }) => {
              const currentValue = useMemo(() => 
                value?.map(v => ({ value: v, label: v })) || []
              , [value]);

              return (
                <FormItem>
                  <FormLabel>Certifications</FormLabel>
                  <FormControl>
                    <CreatableSelect
                      {...field}
                      isMulti
                      options={currentValue}
                      styles={selectStyles}
                      value={currentValue}
                      onChange={(selected) => {
                        onChange(selected ? selected.map((option: any) => option.value) : []);
                      }}
                      placeholder="Enter certifications..."
                      className="w-full"
                      classNamePrefix="certification-select"
                      formatGroupLabel={memoizedFormatGroupLabel}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="languages"
            render={({ field: { onChange, value, ...field } }) => {
              const currentValue = useMemo(() => 
                value?.map(v => ({ value: v, label: v })) || []
              , [value]);

              return (
                <FormItem>
                  <FormLabel>Languages</FormLabel>
                  <FormControl>
                    <CreatableSelect
                      {...field}
                      isMulti
                      options={currentValue}
                      styles={selectStyles}
                      value={currentValue}
                      onChange={(selected) => {
                        onChange(selected ? selected.map((option: any) => option.value) : []);
                      }}
                      placeholder="Enter languages..."
                      className="w-full"
                      classNamePrefix="language-select"
                      formatGroupLabel={memoizedFormatGroupLabel}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          Save Profile
        </Button>
      </form>
    </Form>
  )
} 