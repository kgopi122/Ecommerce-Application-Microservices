package com.ecommerce.promotion.validation;

import com.ecommerce.promotion.model.enumeration.DiscountType;
import com.ecommerce.promotion.model.enumeration.UsageType;
import com.ecommerce.promotion.viewmodel.PromotionDto;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.apache.commons.collections4.CollectionUtils;

public class PromotionValidator implements ConstraintValidator<PromotionConstraint, PromotionDto> {

    private boolean isCreate;

    @Override
    public void initialize(PromotionConstraint constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
    }

    @Override
    public boolean isValid(PromotionDto promotionDto, ConstraintValidatorContext constraintValidatorContext) {
        if (promotionDto == null) {
            return false;
        }
        boolean isValid = true;
        if (UsageType.LIMITED.equals(promotionDto.getUsageType())) {
            isValid = promotionDto.getUsageLimit() > 0;
        } else if (promotionDto.getUsageType() == null) {
            isValid = false;
        }

        isValid = isValid && isValidDiscountType(promotionDto);

        isValid = isValid && isValidApplyToItems(promotionDto, isValid);

        return isValid;
    }

    private static boolean isValidDiscountType(PromotionDto promotion) {
        if (promotion.getDiscountType() == null) {
            return false;
        }
        if (DiscountType.FIXED.equals(promotion.getDiscountType())) {
            return promotion.getDiscountAmount() != null && promotion.getDiscountAmount() > 0;
        } else if (DiscountType.PERCENTAGE.equals(promotion.getDiscountType())) {
            return promotion.getDiscountPercentage() != null && promotion.getDiscountPercentage() > 0;
        }
        return false;
    }

    private static boolean isValidApplyToItems(PromotionDto promotion, boolean isValid) {
        if (promotion.getApplyTo() == null) {
            return false;
        }
        return switch (promotion.getApplyTo()) {
            case PRODUCT -> isValid && CollectionUtils.isNotEmpty(promotion.getProductIds());
            case BRAND -> isValid && CollectionUtils.isNotEmpty(promotion.getBrandIds());
            case CATEGORY -> isValid && CollectionUtils.isNotEmpty(promotion.getCategoryIds());
        };
    }
}
