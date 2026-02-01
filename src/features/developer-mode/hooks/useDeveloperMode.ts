import { developerModeStore } from "../model/DeveloperModeStore";

export const useDeveloperMode = () => {
  const isDeveloperMode = developerModeStore((state) => state.isDeveloperMode);
  const setDeveloperMode = developerModeStore((state) => state.setDeveloperMode);
  const enableWithPassword = developerModeStore((state) => state.enableWithPassword);
  const toggle = developerModeStore((state) => state.toggle);
  const reset = developerModeStore((state) => state.reset);

  const enableDeveloperMode = (password: string): boolean => {
    return enableWithPassword(password);
  };

  const disableDeveloperMode = () => {
    setDeveloperMode(false);
  };

  const toggleDeveloperMode = () => {
    toggle();
  };

  return {
    isDeveloperMode,
    enableDeveloperMode,
    disableDeveloperMode,
    toggleDeveloperMode,
  };
};
