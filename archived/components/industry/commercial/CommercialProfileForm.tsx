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
import { CommercialDealType, CommercialPropertyType } from "@prisma/client"
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { selectStyles } from "@/components/ui/select-styles"
import { GroupBase } from 'react-select'
import { useMemo, useCallback } from "react"

const commercialProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  yearsExperience: z.number().min(0).max(100),
  propertyTypes: z.array(z.nativeEnum(CommercialPropertyType)),
  dealTypes: z.array(z.nativeEnum(CommercialDealType)),
  specializations: z.array(z.string()),
  serviceAreas: z.array(z.string()),
  licensedStates: z.array(z.string()),
  minDealSize: z.number().min(0),
  maxDealSize: z.number().min(0),
  averageDealSize: z.number().min(0),
  monthlyTransactions: z.number().min(0),
  totalTransactionVolume: z.number().min(0),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  bio: z.string().max(1000),
})

type CommercialProfileData = z.infer<typeof commercialProfileSchema>

interface CommercialProfileFormProps {
  initialData?: Partial<CommercialProfileData>
  onSubmit: (data: CommercialProfileData) => Promise<void>
  isSubmitting?: boolean
}

export function CommercialProfileForm({
  initialData,
  onSubmit,
  isSubmitting
}: CommercialProfileFormProps) {
  const form = useForm<CommercialProfileData>({
    resolver: zodResolver(commercialProfileSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      licenseNumber: initialData?.licenseNumber || "",
      yearsExperience: initialData?.yearsExperience || 0,
      propertyTypes: initialData?.propertyTypes || [],
      dealTypes: initialData?.dealTypes || [],
      specializations: initialData?.specializations || [],
      serviceAreas: initialData?.serviceAreas || [],
      licensedStates: initialData?.licensedStates || [],
      minDealSize: initialData?.minDealSize || 0,
      maxDealSize: initialData?.maxDealSize || 0,
      averageDealSize: initialData?.averageDealSize || 0,
      monthlyTransactions: initialData?.monthlyTransactions || 0,
      totalTransactionVolume: initialData?.totalTransactionVolume || 0,
      certifications: initialData?.certifications || [],
      languages: initialData?.languages || [],
      bio: initialData?.bio || "",
    }
  })

  const handleSubmit = async (data: CommercialProfileData) => {
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

  // Memoize property type options
  const propertyTypeOptions = useMemo(() => 
    Object.values(CommercialPropertyType).map(type => ({
      value: type,
      label: type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    }))
  , []);

  // Memoize deal type options
  const dealTypeOptions = useMemo(() => 
    Object.values(CommercialDealType).map(type => ({
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
                <FormLabel>License Number</FormLabel>
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
            name="propertyTypes"
            render={({ field: { onChange, value, ...field } }) => {
              const currentValue = useMemo(() => 
                propertyTypeOptions.filter(option => value?.includes(option.value))
              , [value]);

              return (
                <FormItem>
                  <FormLabel>Property Types</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      isMulti
                      options={propertyTypeOptions}
                      styles={selectStyles}
                      value={currentValue}
                      onChange={(selected) => {
                        onChange(selected ? selected.map((option: any) => option.value) : []);
                      }}
                      placeholder="Select property types..."
                      className="w-full"
                      classNamePrefix="property-type-select"
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
            name="dealTypes"
            render={({ field: { onChange, value, ...field } }) => {
              const currentValue = useMemo(() => 
                dealTypeOptions.filter(option => value?.includes(option.value))
              , [value]);

              return (
                <FormItem>
                  <FormLabel>Deal Types</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      isMulti
                      options={dealTypeOptions}
                      styles={selectStyles}
                      value={currentValue}
                      onChange={(selected) => {
                        onChange(selected ? selected.map((option: any) => option.value) : []);
                      }}
                      placeholder="Select deal types..."
                      className="w-full"
                      classNamePrefix="deal-type-select"
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
            name="minDealSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Deal Size</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxDealSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Deal Size</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="averageDealSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Average Deal Size</FormLabel>
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
            name="totalTransactionVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Transaction Volume</FormLabel>
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