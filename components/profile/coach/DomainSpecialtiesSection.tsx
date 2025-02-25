"use client"

import { Control } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSectionHeader } from "../common/FormSectionHeader";
import { CoachProfileFormValues } from "../types";
import { Home, Building, FileText, FileCheck, Shield, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const INDUSTRY_SPECIALTIES = {
  REALTOR: "REALTOR",
  INVESTOR: "INVESTOR",
  MORTGAGE: "MORTGAGE",
  PROPERTY_MANAGER: "PROPERTY_MANAGER",
  TITLE_ESCROW: "TITLE_ESCROW",
  INSURANCE: "INSURANCE",
  COMMERCIAL: "COMMERCIAL", 
  PRIVATE_CREDIT: "PRIVATE_CREDIT"
} as const;

const SPECIALTY_OPTIONS = [
  {
    id: "REALTOR",
    label: "Real Estate Agent",
    icon: <Home className="h-4 w-4" />
  },
  {
    id: "INVESTOR",
    label: "Real Estate Investor",
    icon: <Wallet className="h-4 w-4" />
  },
  {
    id: "MORTGAGE",
    label: "Mortgage Professional",
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: "PROPERTY_MANAGER",
    label: "Property Manager",
    icon: <Building className="h-4 w-4" />
  },
  {
    id: "TITLE_ESCROW",
    label: "Title & Escrow",
    icon: <FileCheck className="h-4 w-4" />
  },
  {
    id: "INSURANCE",
    label: "Insurance",
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: "COMMERCIAL",
    label: "Commercial Real Estate",
    icon: <Building className="h-4 w-4" />
  },
  {
    id: "PRIVATE_CREDIT",
    label: "Private Credit",
    icon: <Wallet className="h-4 w-4" />
  }
];

interface DomainSpecialtiesSectionProps {
  control: Control<CoachProfileFormValues>;
  saveSpecialties?: (specialties: string[]) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function DomainSpecialtiesSection({
  control,
  saveSpecialties,
  isSubmitting = false
}: DomainSpecialtiesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Industry Specialties</CardTitle>
        <CardDescription>
          Define your coaching specialties and industry expertise to help clients find you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="info">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            After selecting your specialties, you must click "Save Coach Profile" at the bottom of this form to activate the corresponding profile tabs. Specialty tabs will only appear after your selections are saved.
          </AlertDescription>
        </Alert>

        <FormField
          control={control}
          name="domainSpecialties"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SPECIALTY_OPTIONS.map((specialty) => {
                  const isChecked = field.value?.includes(specialty.id);
                  return (
                    <div
                      key={specialty.id}
                      className={`flex items-center space-x-3 p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors ${
                        isChecked ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <Checkbox
                        id={specialty.id}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const currentValue = field.value || [];
                          if (checked) {
                            field.onChange([...currentValue, specialty.id]);
                          } else {
                            field.onChange(currentValue.filter(val => val !== specialty.id));
                          }
                        }}
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor={specialty.id}
                        className="flex items-center space-x-2 text-sm font-medium leading-none cursor-pointer"
                      >
                        {specialty.icon}
                        <span>{specialty.label}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
} 