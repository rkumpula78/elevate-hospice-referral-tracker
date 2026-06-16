import { supabase } from "@/integrations/supabase/client";

const toUniqueSortedNames = (names: string[]) =>
  Array.from(new Set(names.map((name) => name.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );

export const fetchStaffOptionNames = async (roles: string[]) => {
  const [profilesResult, staffResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, staff_type")
      .in("staff_type", roles)
      .not("first_name", "is", null)
      .not("last_name", "is", null),
    supabase
      .from("staff")
      .select("name, role, is_active")
      .in("role", roles)
      .eq("is_active", true),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (staffResult.error) throw staffResult.error;

  const profileNames = (profilesResult.data || []).map(
    (profile) => `${profile.first_name} ${profile.last_name}`
  );
  const staffNames = (staffResult.data || []).map((staff) => staff.name);

  return toUniqueSortedNames([...profileNames, ...staffNames]);
};

export const fetchMarketerNames = () => fetchStaffOptionNames(["marketer", "admin"]);

export const fetchIntakeCoordinatorNames = () =>
  fetchStaffOptionNames(["intake_coordinator", "admin"]);