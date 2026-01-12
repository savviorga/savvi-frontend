const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/categories`;

export const CategoryService = {
  
  getAll: async () => {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error();
    return res.json();
  },

};
