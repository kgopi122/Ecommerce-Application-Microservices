package com.ecommerce.productservice.helper;

import com.ecommerce.productservice.entity.Category;
import com.ecommerce.productservice.dto.CategoryDto;

import java.util.Optional;

public interface CategoryMappingHelper {

    static CategoryDto map(final Category category) {
        if (category == null) {
            return null;
        }
        CategoryDto parentCategoryDto = null;
        if (category.getParentCategory() != null && category.getParentCategory().getCategoryId() != null) {
            parentCategoryDto = CategoryDto.builder()
                    .categoryId(category.getParentCategory().getCategoryId())
                    .categoryTitle(category.getParentCategory().getCategoryTitle())
                    .imageUrl(category.getParentCategory().getImageUrl())
                    .build();
        }
        return CategoryDto.builder()
                .categoryId(category.getCategoryId())
                .categoryTitle(category.getCategoryTitle())
                .imageUrl(category.getImageUrl())
                .parentCategoryDto(parentCategoryDto)
                .build();
    }

    static Category map(CategoryDto categoryDto) {
        if (categoryDto == null) {
            return null;
        }
        Category parentCategory = null;
        if (categoryDto.getParentCategoryDto() != null && categoryDto.getParentCategoryDto().getCategoryId() != null) {
            parentCategory = Category.builder()
                    .categoryId(categoryDto.getParentCategoryDto().getCategoryId())
                    .categoryTitle(categoryDto.getParentCategoryDto().getCategoryTitle())
                    .imageUrl(categoryDto.getParentCategoryDto().getImageUrl())
                    .build();
        }
        return Category.builder()
                .categoryId(categoryDto.getCategoryId())
                .categoryTitle(categoryDto.getCategoryTitle())
                .imageUrl(categoryDto.getImageUrl())
                .parentCategory(parentCategory)
                .build();
    }

}
