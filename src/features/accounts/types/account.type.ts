export interface Account {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  description: string;
  isActive: boolean;
  balance?: number;
}

export interface CreateAccountDto {
  name: string;
  description: string;
  initialBalance?: number;
}