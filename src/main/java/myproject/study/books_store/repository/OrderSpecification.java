package myproject.study.books_store.repository;

import jakarta.persistence.criteria.*;
import myproject.study.books_store.model.Order;
import myproject.study.books_store.model.User;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * JPA Specification for dynamic Order filtering
 * Supports keyword search, status filter, and date range filter
 */
public class OrderSpecification {

    /**
     * Search by keyword in order code, customer name, or customer email
     */
    public static Specification<Order> hasKeyword(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            String searchPattern = "%" + keyword.toLowerCase() + "%";
            
            Join<Order, User> userJoin = root.join("user", JoinType.LEFT);

            Predicate orderCodePredicate = criteriaBuilder.like(
                criteriaBuilder.lower(root.get("orderCode")), 
                searchPattern
            );
            
            Predicate customerNamePredicate = criteriaBuilder.like(
                criteriaBuilder.lower(userJoin.get("fullName")), 
                searchPattern
            );
            
            Predicate customerUsernamePredicate = criteriaBuilder.like(
                criteriaBuilder.lower(userJoin.get("username")), 
                searchPattern
            );
            
            Predicate customerEmailPredicate = criteriaBuilder.like(
                criteriaBuilder.lower(userJoin.get("email")), 
                searchPattern
            );

            return criteriaBuilder.or(
                orderCodePredicate,
                customerNamePredicate,
                customerUsernamePredicate,
                customerEmailPredicate
            );
        };
    }

    /**
     * Filter by order status
     */
    public static Specification<Order> hasStatus(String status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null || status.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("status"), status);
        };
    }

    /**
     * Filter by payment method
     */
    public static Specification<Order> hasPaymentMethod(String paymentMethod) {
        return (root, query, criteriaBuilder) -> {
            if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("paymentMethod"), paymentMethod);
        };
    }

    /**
     * Filter by date range - from date
     */
    public static Specification<Order> createdAfter(LocalDate fromDate) {
        return (root, query, criteriaBuilder) -> {
            if (fromDate == null) {
                return criteriaBuilder.conjunction();
            }
            LocalDateTime startOfDay = fromDate.atStartOfDay();
            return criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startOfDay);
        };
    }

    /**
     * Filter by date range - to date
     */
    public static Specification<Order> createdBefore(LocalDate toDate) {
        return (root, query, criteriaBuilder) -> {
            if (toDate == null) {
                return criteriaBuilder.conjunction();
            }
            LocalDateTime endOfDay = toDate.atTime(LocalTime.MAX);
            return criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endOfDay);
        };
    }

    /**
     * Combine all filters
     */
    public static Specification<Order> filterOrders(
            String keyword,
            String status,
            String paymentMethod,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        return Specification.where(hasKeyword(keyword))
                .and(hasStatus(status))
                .and(hasPaymentMethod(paymentMethod))
                .and(createdAfter(fromDate))
                .and(createdBefore(toDate));
    }
}
