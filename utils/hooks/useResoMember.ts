import { useState } from "react";
import { z } from "zod";

export const ResoMemberSchema = z.object({
  memberKey: z.string().optional(),
  memberStatus: z.string(),
  designations: z.array(z.string()),
  licenseNumber: z.string().optional(),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export type ResoMemberData = z.infer<typeof ResoMemberSchema>;

export function useResoMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResoMemberData | null>(null);

  const fetchResoMember = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/reso");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch RESO member data");
      }

      setData(result.data);
    } catch (err) {
      console.error("[USE_RESO_MEMBER] Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateResoMember = async (updateData: Partial<ResoMemberData>) => {
    setLoading(true);
    setError(null);

    try {
      // Merge with existing data to ensure all required fields are present
      const mergedData = {
        ...data,
        ...updateData,
      };

      // Validate the merged data
      ResoMemberSchema.parse(mergedData);

      const response = await fetch("/api/user/reso", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mergedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update RESO member data");
      }

      setData(result.data);
      return result.data;
    } catch (err) {
      console.error("[USE_RESO_MEMBER] Error:", err);
      if (err instanceof z.ZodError) {
        setError("Invalid data format");
        throw err;
      }
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetchResoMember,
    updateResoMember,
  };
} 