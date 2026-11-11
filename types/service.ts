export type ServiceCategory = "CLEANING" | "LAUNDRY" | "DOMESTIC_SUPPORT" | "PEST_CONTROL";

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ServiceCategory;
  imageUrl?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}
