export interface Account {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  description: string;
  isActive: boolean;
}

export interface CreateAccountDto {
  name: string;
  description: string;
}