import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { AdminPage } from '../../refactoring/components/AdminPage';
import { CartPage } from '../../refactoring/components/CartPage';
import { Accordion, Select } from '../../refactoring/components/shared';
import { useForm } from '../../refactoring/hooks/useForm';
import { cn } from '../../refactoring/utils';
import { clamp } from '../../refactoring/utils/number';
import { Coupon, Product } from '../../types';

const mockProducts: Product[] = [
  {
    id: 'p1',
    name: '상품1',
    price: 10000,
    stock: 20,
    discounts: [{ quantity: 10, rate: 0.1 }],
  },
  {
    id: 'p2',
    name: '상품2',
    price: 20000,
    stock: 20,
    discounts: [{ quantity: 10, rate: 0.15 }],
  },
  {
    id: 'p3',
    name: '상품3',
    price: 30000,
    stock: 20,
    discounts: [{ quantity: 10, rate: 0.2 }],
  },
];
const mockCoupons: Coupon[] = [
  {
    name: '5000원 할인 쿠폰',
    code: 'AMOUNT5000',
    discountType: 'amount',
    discountValue: 5000,
  },
  {
    name: '10% 할인 쿠폰',
    code: 'PERCENT10',
    discountType: 'percentage',
    discountValue: 10,
  },
];

const TestAdminPage = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);

  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts((prevProducts) => prevProducts.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
  };

  const handleProductAdd = (newProduct: Product) => {
    setProducts((prevProducts) => [...prevProducts, newProduct]);
  };

  const handleCouponAdd = (newCoupon: Coupon) => {
    setCoupons((prevCoupons) => [...prevCoupons, newCoupon]);
  };

  return (
    <AdminPage
      products={products}
      coupons={coupons}
      onProductUpdate={handleProductUpdate}
      onProductAdd={handleProductAdd}
      onCouponAdd={handleCouponAdd}
    />
  );
};

describe('advanced > ', () => {
  describe('시나리오 테스트 > ', () => {
    test('장바구니 페이지 테스트 > ', async () => {
      render(<CartPage products={mockProducts} coupons={mockCoupons} />);
      const product1 = screen.getByTestId('product-p1');
      const product2 = screen.getByTestId('product-p2');
      const product3 = screen.getByTestId('product-p3');
      const addToCartButtonsAtProduct1 = within(product1).getByText('장바구니에 추가');
      const addToCartButtonsAtProduct2 = within(product2).getByText('장바구니에 추가');
      const addToCartButtonsAtProduct3 = within(product3).getByText('장바구니에 추가');

      // 1. 상품 정보 표시
      expect(product1).toHaveTextContent('상품1');
      expect(product1).toHaveTextContent('10,000원');
      expect(product1).toHaveTextContent('재고: 20개');
      expect(product2).toHaveTextContent('상품2');
      expect(product2).toHaveTextContent('20,000원');
      expect(product2).toHaveTextContent('재고: 20개');
      expect(product3).toHaveTextContent('상품3');
      expect(product3).toHaveTextContent('30,000원');
      expect(product3).toHaveTextContent('재고: 20개');

      // 2. 할인 정보 표시
      expect(screen.getByText('10개 이상: 10% 할인')).toBeInTheDocument();

      // 3. 상품1 장바구니에 상품 추가
      fireEvent.click(addToCartButtonsAtProduct1); // 상품1 추가

      // 4. 할인율 계산
      expect(screen.getByText('상품 금액: 10,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 0원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 10,000원')).toBeInTheDocument();

      // 5. 상품 품절 상태로 만들기
      for (let i = 0; i < 19; i++) {
        fireEvent.click(addToCartButtonsAtProduct1);
      }

      // 6. 품절일 때 상품 추가 안 되는지 확인하기
      expect(product1).toHaveTextContent('재고: 0개');
      fireEvent.click(addToCartButtonsAtProduct1);
      expect(product1).toHaveTextContent('재고: 0개');

      // 7. 할인율 계산
      expect(screen.getByText('상품 금액: 200,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 20,000원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 180,000원')).toBeInTheDocument();

      // 8. 상품을 각각 10개씩 추가하기
      fireEvent.click(addToCartButtonsAtProduct2); // 상품2 추가
      fireEvent.click(addToCartButtonsAtProduct3); // 상품3 추가

      const increaseButtons = screen.getAllByText('+');
      for (let i = 0; i < 9; i++) {
        fireEvent.click(increaseButtons[1]); // 상품2
        fireEvent.click(increaseButtons[2]); // 상품3
      }

      // 9. 할인율 계산
      expect(screen.getByText('상품 금액: 700,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 110,000원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 590,000원')).toBeInTheDocument();

      // 10. 쿠폰 적용하기
      const couponSelect = screen.getByRole('combobox');
      fireEvent.change(couponSelect, { target: { value: '1' } }); // 10% 할인 쿠폰 선택

      // 11. 할인율 계산
      expect(screen.getByText('상품 금액: 700,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 169,000원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 531,000원')).toBeInTheDocument();

      // 12. 다른 할인 쿠폰 적용하기
      fireEvent.change(couponSelect, { target: { value: '0' } }); // 5000원 할인 쿠폰
      expect(screen.getByText('상품 금액: 700,000원')).toBeInTheDocument();
      expect(screen.getByText('할인 금액: 115,000원')).toBeInTheDocument();
      expect(screen.getByText('최종 결제 금액: 585,000원')).toBeInTheDocument();
    });

    test('관리자 페이지 테스트 > ', async () => {
      render(<TestAdminPage />);

      const $product1 = screen.getByTestId('product-1');

      // 1. 새로운 상품 추가
      fireEvent.click(screen.getByText('새 상품 추가'));

      fireEvent.change(screen.getByLabelText('상품명'), { target: { value: '상품4' } });
      fireEvent.change(screen.getByLabelText('가격'), { target: { value: '15000' } });
      fireEvent.change(screen.getByLabelText('재고'), { target: { value: '30' } });

      fireEvent.click(screen.getByText('추가'));

      const $product4 = screen.getByTestId('product-4');

      expect($product4).toHaveTextContent('상품4');
      expect($product4).toHaveTextContent('15000원');
      expect($product4).toHaveTextContent('재고: 30');

      // 2. 상품 선택 및 수정
      fireEvent.click($product1);
      fireEvent.click(within($product1).getByTestId('toggle-button'));
      fireEvent.click(within($product1).getByTestId('modify-button'));

      act(() => {
        fireEvent.change(within($product1).getByDisplayValue('20'), { target: { value: '25' } });
        fireEvent.change(within($product1).getByDisplayValue('10000'), { target: { value: '12000' } });
        fireEvent.change(within($product1).getByDisplayValue('상품1'), { target: { value: '수정된 상품1' } });
      });

      fireEvent.click(within($product1).getByText('수정 완료'));

      expect($product1).toHaveTextContent('수정된 상품1');
      expect($product1).toHaveTextContent('12000원');
      expect($product1).toHaveTextContent('재고: 25');

      // 3. 상품 할인율 추가 및 삭제
      fireEvent.click($product1);
      fireEvent.click(within($product1).getByTestId('modify-button'));

      // 할인 추가
      act(() => {
        fireEvent.change(screen.getByPlaceholderText('수량'), { target: { value: '5' } });
        fireEvent.change(screen.getByPlaceholderText('할인율 (%)'), { target: { value: '5' } });
      });
      fireEvent.click(screen.getByText('할인 추가'));

      expect(screen.queryByText('5개 이상 구매 시 5% 할인')).toBeInTheDocument();

      // 할인 삭제
      fireEvent.click(screen.getAllByText('삭제')[0]);
      expect(screen.queryByText('10개 이상 구매 시 10% 할인')).not.toBeInTheDocument();
      expect(screen.queryByText('5개 이상 구매 시 5% 할인')).toBeInTheDocument();

      fireEvent.click(screen.getAllByText('삭제')[0]);
      expect(screen.queryByText('10개 이상 구매 시 10% 할인')).not.toBeInTheDocument();
      expect(screen.queryByText('5개 이상 구매 시 5% 할인')).not.toBeInTheDocument();

      // 4. 쿠폰 추가
      fireEvent.change(screen.getByPlaceholderText('쿠폰 이름'), { target: { value: '새 쿠폰' } });
      fireEvent.change(screen.getByPlaceholderText('쿠폰 코드'), { target: { value: 'NEW10' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'percentage' } });
      fireEvent.change(screen.getByPlaceholderText('할인 값'), { target: { value: '10' } });

      fireEvent.click(screen.getByText('쿠폰 추가'));

      const $newCoupon = screen.getByTestId('coupon-3');

      expect($newCoupon).toHaveTextContent('새 쿠폰 (NEW10):10% 할인');
    });
  });

  describe('Accordion 컴포넌트 테스트', () => {
    test('기본 렌더링 및 동작 테스트', () => {
      render(
        <Accordion>
          <Accordion.Trigger>제목</Accordion.Trigger>
          <Accordion.Content>내용</Accordion.Content>
        </Accordion>
      );

      const trigger = screen.getByText('제목');
      expect(trigger).toBeInTheDocument();
      expect(screen.queryByText('내용')).not.toBeInTheDocument();

      fireEvent.click(trigger);
      expect(screen.getByText('내용')).toBeInTheDocument();

      fireEvent.click(trigger);
      expect(screen.queryByText('내용')).not.toBeInTheDocument();
    });

    test('defaultOpen prop 테스트', () => {
      render(
        <Accordion defaultOpen>
          <Accordion.Trigger>제목</Accordion.Trigger>
          <Accordion.Content>내용</Accordion.Content>
        </Accordion>
      );

      expect(screen.getByText('내용')).toBeInTheDocument();
    });

    test('disabled prop 테스트', () => {
      render(
        <Accordion disabled>
          <Accordion.Trigger>제목</Accordion.Trigger>
          <Accordion.Content>내용</Accordion.Content>
        </Accordion>
      );

      const trigger = screen.getByText('제목');
      fireEvent.click(trigger);
      expect(screen.queryByText('내용')).not.toBeInTheDocument();
    });

    test('onOpenChange 콜백 테스트', () => {
      const onOpenChange = vi.fn();
      render(
        <Accordion onOpenChange={onOpenChange}>
          <Accordion.Trigger>제목</Accordion.Trigger>
          <Accordion.Content>내용</Accordion.Content>
        </Accordion>
      );

      const trigger = screen.getByText('제목');
      fireEvent.click(trigger);
      expect(onOpenChange).toHaveBeenCalledWith(true);

      fireEvent.click(trigger);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Select 컴포넌트 테스트', () => {
    const options = [
      { label: '옵션1', value: '1' },
      { label: '옵션2', value: '2' },
      { label: '옵션3', value: '3' },
    ];

    test('옵션을 선택하면 onValueChange 함수가 호출된다.', () => {
      const onValueChange = vi.fn();
      render(<Select options={options} onValueChange={onValueChange} />);
      const selectElement = screen.getByRole('combobox');

      fireEvent.change(selectElement, { target: { value: '2' } });
      expect(onValueChange).toHaveBeenCalledWith('2');

      fireEvent.change(selectElement, { target: { value: '1' } });
      expect(onValueChange).toHaveBeenCalledWith('1');

      expect(onValueChange).toHaveBeenCalledTimes(2);
    });

    test('모든 옵션이 올바르게 렌더링된다.', () => {
      render(<Select options={options} onValueChange={() => {}} />);
      const optionElements = screen.getAllByRole('option');

      expect(optionElements).toHaveLength(options.length);
      options.forEach((option, index) => {
        expect(optionElements[index]).toHaveTextContent(option.label);
        expect(optionElements[index]).toHaveValue(option.value);
      });
    });

    test('기본값이 설정되면 해당 옵션이 선택된다.', () => {
      const defaultValue = '2';
      render(<Select options={options} onValueChange={() => {}} defaultValue={defaultValue} />);
      const selectElement = screen.getByRole('combobox') as HTMLSelectElement;

      expect(selectElement.value).toBe(defaultValue);
    });
  });

  describe('clamp 함수 테스트', () => {
    test('주어진 값이 최소값보다 작으면 최소값을 반환한다.', () => {
      const min = 2;
      const max = 3;
      const value = 1;
      expect(clamp(value, min, max)).toBe(min);
    });

    test('주어진 값이 최대값보다 크면 최대값을 반환한다.', () => {
      const min = 2;
      const max = 3;
      const value = 4;
      expect(clamp(value, min, max)).toBe(max);
    });

    test('주어진 값이 최소값과 최대값 범위 내로 있으면 그대로 반환한다.', () => {
      const min = 2;
      const max = 3;
      const value = 2;
      expect(clamp(value, min, max)).toBe(value);
    });

    test('주어진 값이 최소값과 최대값이 같은 경우 최소값을 반환한다.', () => {
      const min = 2;
      const max = 2;
      const value = 2;
      expect(clamp(value, min, max)).toBe(value);
    });

    test('주어진 값이 최소값보다 작으면 최소값을 반환한다.', () => {
      const min = 2;
      const max = 3;
      const value = 1;
      expect(clamp(value, min, max)).toBe(min);
    });
  });

  describe('cn 함수테스트', () => {
    test('두 개의 클래스를 전달하면 두 개의 클래스를 반환한다.', () => {
      expect(cn('a', 'b')).toBe('a b');
    });

    test('여러 개의 클래스를 전달하면 하나의 클래스로 반환한다.', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    test('undefined 값은 무시된다.', () => {
      expect(cn('a', undefined, 'c')).toBe('a c');
    });
  });

  describe('useForm 훅', () => {
    test('초기값이 올바르게 설정되는지 확인', () => {
      const initialValues = { name: '', age: 0 };
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.values).toEqual(initialValues);
    });

    test('handleChange 함수가 값을 올바르게 업데이트하는지 확인', () => {
      const initialValues = { name: '', age: 0 };
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.updateValue('name', '감자');
      });

      expect(result.current.values.name).toBe('감자');
    });

    test('reset 함수가 초기값으로 되돌리는지 확인', () => {
      const initialValues = { name: '', age: 0 };
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.updateValue('name', '감자');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
    });
  });
});
