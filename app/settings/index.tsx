import { SettingsScreen } from "@/features/settings";
import { useNavigation } from "expo-router";

export default function Page() {
  const navigation = useNavigation();
  return <SettingsScreen onNavigateBack={() => navigation.goBack()} />;
}
