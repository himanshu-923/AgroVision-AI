import { useMutation, useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAnalyzeImage() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.analyses.analyze.path, {
        method: api.analyses.analyze.method,
        body: formData, // FormData sends multipart/form-data naturally
      });
      
      if (!res.ok) {
        throw new Error("Failed to analyze image");
      }
      
      return await res.json();
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
    }
  });
}

export function useAnalysis(id: number | null) {
  return useQuery({
    queryKey: [api.analyses.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.analyses.get.path, { id });
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error("Analysis not found");
      }
      
      return await res.json();
    },
    enabled: !!id,
  });
}
