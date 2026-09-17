import { projectSearchDemo } from "@/entities/project/model/project-search-demo";
import { sellerDemo } from "@/entities/seller/model/seller-demo";

export const wishlistProjects = [0, 1, 2, 5, 3, 4].map((index) => projectSearchDemo[index]);
export const wishlistSellers = sellerDemo.map((seller) => ({
  ...seller,
  followers: seller.followers - 1,
}));
