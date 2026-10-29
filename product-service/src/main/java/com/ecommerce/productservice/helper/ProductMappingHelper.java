package com.ecommerce.productservice.helper;

import com.ecommerce.productservice.entity.Category;
import com.ecommerce.productservice.entity.Product;
import com.ecommerce.productservice.dto.CategoryDto;
import com.ecommerce.productservice.dto.ProductDto;

public interface ProductMappingHelper {
    static ProductDto map(final Product product) {
        if (product == null) {
            return null;
        }
        CategoryDto categoryDto = null;
        if (product.getCategory() != null && product.getCategory().getCategoryId() != null) {
            categoryDto = CategoryDto.builder()
                    .categoryId(product.getCategory().getCategoryId())
                    .categoryTitle(product.getCategory().getCategoryTitle())
                    .imageUrl(product.getCategory().getImageUrl())
                    .build();
        }
        return ProductDto.builder()
                .productId(product.getProductId())
                .productTitle(product.getProductTitle())
                .imageUrl(product.getImageUrl())
                .sku(product.getSku())
                .priceUnit(product.getPriceUnit())
                .quantity(product.getQuantity())
                .categoryDto(categoryDto)
                .build();
    }

    static Product map(final ProductDto productDto) {
        if (productDto == null) {
            return null;
        }
        Category category = null;
        if (productDto.getCategoryDto() != null && productDto.getCategoryDto().getCategoryId() != null) {
            category = Category.builder()
                    .categoryId(productDto.getCategoryDto().getCategoryId())
                    .categoryTitle(productDto.getCategoryDto().getCategoryTitle())
                    .imageUrl(productDto.getCategoryDto().getImageUrl())
                    .build();
        }
        return Product.builder()
                .productId(productDto.getProductId())
                .productTitle(productDto.getProductTitle())
                .imageUrl(productDto.getImageUrl())
                .sku(productDto.getSku())
                .priceUnit(productDto.getPriceUnit())
                .quantity(productDto.getQuantity())
                .category(category)
                .build();
    }

}
