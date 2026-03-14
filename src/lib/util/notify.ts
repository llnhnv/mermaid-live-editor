import { toast } from 'svelte-sonner';

export const notify = (message: string): void => {
  toast(message);
};

export const notifySuccess = (message: string): void => {
  toast.success(message);
};

export const notifyError = (message: string): void => {
  toast.error(message);
};

export const prompt = (message: string): boolean => {
  return confirm(message);
};
