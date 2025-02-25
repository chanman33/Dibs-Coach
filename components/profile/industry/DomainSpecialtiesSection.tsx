interface DomainSpecialtiesSectionProps {
  control: Control<any>;
  saveSpecialties?: (specialties: string[]) => Promise<boolean>;
  isSubmitting?: boolean;
} 