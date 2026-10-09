# ADDITIONAL RULE — SMART COMPONENT BREAKDOWN & READABLE CODE

The codebase must be easy for a human developer to read, understand, debug, and modify.

Do not optimize only for abstraction or theoretical architecture.

Optimize for:

- readability
- simplicity
- maintainability
- clear responsibilities
- easy debugging
- predictable file structure
- sensible component boundaries

---

# SMART COMPONENT BREAKDOWN

Break components into smaller components only when there is a meaningful reason.

A component should normally be extracted when:

- it is reused in multiple places
- it represents a distinct UI section
- it has independent business/UI logic
- it has its own state
- it has significant conditional rendering
- it becomes difficult to understand inside the parent
- extracting it makes the parent screen easier to read
- it is likely to change independently
- it deserves independent testing

For example, a dashboard screen may reasonably look like:

```text
DashboardScreen
├── DashboardHeader
├── RestaurantSummary
├── TableOverview
├── ActiveOrdersSection
├── RecentOrdersList
└── DashboardBottomActions
```

instead of putting the entire screen inside one 1000-line component.

However, do NOT over-componentize.

Do not create components such as:

```text
TitleWrapper
TitleContainer
TitleTextWrapper
HeaderLeftWrapper
HeaderRightWrapper
CardTopWrapper
CardBottomWrapper
```

when they contain only a few lines and provide no meaningful abstraction.

Avoid component fragmentation where understanding one screen requires opening 20 files.

The goal is:

```text
large enough to understand in context
small enough to remain maintainable
```

---

# SCREEN COMPONENT RESPONSIBILITY

Screens should mainly orchestrate the feature.

A screen should ideally handle:

- connecting feature hooks
- choosing what state to display
- coordinating child components
- navigation events
- high-level screen behaviour

Screens should NOT contain large amounts of:

- API implementation
- data transformation
- validation schemas
- storage logic
- complicated reusable business rules

Example:

Prefer:

```typescript
function DashboardScreen() {
  const {
    restaurant,
    tables,
    activeOrders,
    isLoading,
    refresh,
  } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ScreenContainer>
      <DashboardHeader restaurant={restaurant} />

      <TableOverview tables={tables} />

      <ActiveOrdersSection orders={activeOrders} />

      <RecentOrdersList />

      <RefreshControl onRefresh={refresh} />
    </ScreenContainer>
  );
}
```

instead of a screen containing hundreds of lines of fetching, transformations, conditions, API calls, and JSX.

---

# COMPONENT RESPONSIBILITY

Every component should have a clear purpose.

A developer should be able to answer:

```text
What responsibility does this component have?
```

in one sentence.

For example:

```text
OrderCard
Displays the summary and status of one order.
```

Good.

But if the answer becomes:

```text
It displays orders, fetches users, stores authentication,
opens settings, handles payments, and updates restaurant data.
```

the component has too many responsibilities and should be refactored.

---

# KEEP FILES REASONABLY SIZED

There is no absolute line limit.

Do not split files based only on line count.

However, use line count as a warning signal.

Approximately:

```text
0–150 lines
Usually comfortable.

150–300 lines
Review whether responsibilities are still clear.

300–500 lines
Strongly investigate component extraction/refactoring.

500+ lines
Usually indicates too many responsibilities unless there is a very good reason.
```

Do not mechanically split a 310-line file merely to satisfy a number.

Always split based on responsibility.

---

# KEEP JSX EASY TO READ

Avoid massive deeply nested JSX trees.

Bad:

```tsx
<View>
  <View>
    <View>
      <View>
        <View>
          ...
        </View>
      </View>
    </View>
  </View>
</View>
```

Use semantic components when sections have meaning.

Prefer:

```tsx
<ScreenContainer>
  <Header />

  <OrderSummary />

  <PaymentSection />

  <FooterActions />
</ScreenContainer>
```

This should make the screen structure understandable immediately.

---

# AVOID UNNECESSARY ABSTRACTION

Do not create abstractions merely because two pieces of code look vaguely similar.

Apply abstraction when there is genuine shared behaviour.

Do NOT prematurely create:

```text
GenericDynamicSuperComponent
UniversalRenderer
ConfigDrivenUIFactory
GenericEntityManager
BaseEverythingComponent
```

for simple application UI.

Prefer explicit code when explicit code is easier to understand.

---

# RULE OF THREE

When deciding whether logic should become reusable:

One occurrence:

```text
Keep it local unless complex.
```

Two occurrences:

```text
Observe whether the behaviour is actually identical.
```

Three or more meaningful occurrences:

```text
Consider extracting reusable functionality.
```

This is guidance, not an inflexible rule.

Security, complex business logic, and clearly reusable design-system components may be extracted earlier.

---

# REUSABLE COMPONENTS

Create reusable components for genuinely repeated application elements.

Examples:

```text
AppText
AppButton
AppInput
IconButton
ScreenContainer
AppHeader
Avatar
Divider
EmptyState
ErrorState
LoadingState
BottomSheet
ConfirmationModal
```

Do not create dozens of variants manually such as:

```text
RedButton
BlueButton
GreenButton
LargeBlueButton
SmallBlueButton
```

Instead use controlled variants:

```tsx
<AppButton
  variant="primary"
  size="large"
>
  Continue
</AppButton>
```

---

# FEATURE-SPECIFIC COMPONENTS

Not everything belongs in the global components folder.

Example:

```text
features/orders/
├── components/
│   ├── OrderCard.tsx
│   ├── OrderItem.tsx
│   ├── OrderStatusBadge.tsx
│   └── OrderTotal.tsx
```

If a component belongs specifically to orders, keep it in the orders feature.

Move a component into:

```text
src/components/
```

only when it is truly shared across features.

---

# COMPONENT FOLDER POLICY

Do not create a folder for every tiny component.

For simple components:

```text
OrderCard.tsx
OrderStatusBadge.tsx
OrderItem.tsx
```

is fine.

Create a component folder when the component has multiple related files.

Example:

```text
OrderCard/
├── OrderCard.tsx
├── OrderCard.types.ts
├── OrderCard.test.tsx
└── index.ts
```

Do not create unnecessary folder nesting.

---

# KEEP BUSINESS LOGIC OUT OF JSX

Avoid complicated calculations directly inside JSX.

Bad:

```tsx
<Text>
  {orders
    .filter(order => order.status !== 'CANCELLED')
    .map(order => order.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0))
    .reduce((a, b) => a + b, 0)}
</Text>
```

Prefer:

```typescript
const totalRevenue = calculateTotalRevenue(orders);
```

then:

```tsx
<Text>{totalRevenue}</Text>
```

---

# USE MEANINGFUL HOOKS

Move complicated feature behaviour into well-named hooks when appropriate.

Example:

```typescript
const {
  orders,
  isLoading,
  createOrder,
  cancelOrder,
  refreshOrders,
} = useOrders();
```

instead of implementing all order orchestration directly inside the screen.

Do not create hooks for trivial one-line operations.

Bad:

```typescript
useIsModalVisible()
useGetButtonColor()
useGetPadding()
```

unless such behaviour is genuinely reusable or complex.

---

# HOOK RESPONSIBILITIES

Hooks should also remain focused.

Instead of:

```text
useRestaurantAppEverything()
```

prefer meaningful feature hooks such as:

```text
useRestaurant()
useOrders()
useTables()
useEmployees()
useAuth()
```

When a hook becomes extremely large, split internal responsibilities.

---

# READABLE VARIABLE NAMES

Use descriptive names.

Bad:

```typescript
const d = ...
const x = ...
const arr = ...
const temp = ...
const res = ...
```

Prefer:

```typescript
const restaurantDetails = ...
const activeOrders = ...
const selectedTable = ...
const paymentResponse = ...
```

Short names are acceptable only where conventional and obvious, such as:

```typescript
items.map(item => ...)
```

Avoid excessive abbreviations.

---

# READABLE FUNCTION NAMES

Function names should describe the action.

Prefer:

```typescript
handleCreateOrder()
handleTableSelection()
calculateOrderTotal()
formatCurrency()
refreshSession()
clearUserSession()
```

instead of:

```typescript
handleData()
process()
doStuff()
manage()
func1()
```

---

# EVENT HANDLER NAMING

Use a predictable convention.

Component callback prop:

```typescript
onPress
onSubmit
onSelect
onDelete
onConfirm
```

Internal handler:

```typescript
handlePress
handleSubmit
handleSelect
handleDelete
handleConfirm
```

Example:

```typescript
const handleTablePress = (tableId: string) => {
  navigateToTable(tableId);
};
```

---

# BOOLEAN NAMING

Boolean variables should read naturally.

Prefer:

```typescript
isLoading
isAuthenticated
isSubmitting
isSelected
hasPermission
canEdit
shouldShowWarning
```

Avoid:

```typescript
loadingFlag
auth
check
statusBoolean
value1
```

---

# FUNCTIONS SHOULD BE SMALL AND FOCUSED

Avoid functions performing many unrelated operations.

Bad:

```typescript
handleSubmit()
```

that:

- validates form
- uploads image
- refreshes authentication
- creates user
- updates Redux
- fetches restaurant
- changes theme
- navigates
- shows analytics
- clears cache

Break meaningful responsibilities into appropriately named functions/services.

Example:

```typescript
const handleSubmit = async () => {
  const payload = buildRegistrationPayload(formValues);

  const user = await registerOwner(payload);

  await initializeOwnerSession(user);

  navigateToDashboard();
};
```

---

# EARLY RETURNS

Prefer early returns when they reduce nesting.

Bad:

```typescript
if (user) {
  if (restaurant) {
    if (hasPermission) {
      if (order) {
        // logic
      }
    }
  }
}
```

Prefer:

```typescript
if (!user) return;
if (!restaurant) return;
if (!hasPermission) return;
if (!order) return;

// logic
```

This makes control flow easier to follow.

---

# AVOID COMPLEX TERNARIES

Simple ternary:

```typescript
const title = isEditing ? 'Edit Order' : 'Create Order';
```

is fine.

Avoid:

```typescript
const value = a
  ? b
    ? c
    : d
  : e
    ? f
    : g;
```

Use explicit logic instead.

---

# AVOID LARGE INLINE CALLBACKS

Bad:

```tsx
<Button
  onPress={async () => {
    // 40 lines of code
  }}
/>
```

Prefer:

```tsx
<Button onPress={handleCheckout} />
```

and define:

```typescript
const handleCheckout = async () => {
  ...
};
```

---

# AVOID MAGIC NUMBERS

Bad:

```typescript
if (attempts > 5) {}

setTimeout(callback, 30000);

paddingHorizontal: 17;
```

when those values have semantic meaning.

Prefer:

```typescript
const MAX_LOGIN_ATTEMPTS = 5;
const SESSION_REFRESH_TIMEOUT_MS = 30_000;
```

Design measurements may remain inside design tokens.

---

# AVOID MAGIC STRINGS

Bad:

```typescript
if (role === 'OWNER') {}
```

repeated throughout the application.

Prefer shared domain values:

```typescript
enum UserRole {
  Owner = 'OWNER',
  Manager = 'MANAGER',
  Employee = 'EMPLOYEE',
}
```

or an appropriate typed constant.

---

# TYPES SHOULD BE EASY TO UNDERSTAND

Avoid giant inline object types.

Bad:

```typescript
const handleUser = (
  user: {
    id: string;
    restaurant: {
      id: string;
      ...
    };
  },
) => {};
```

Prefer:

```typescript
interface User {
  ...
}

interface Restaurant {
  ...
}
```

Use domain-specific types.

---

# PROP TYPES

Give component props meaningful names.

Example:

```typescript
interface OrderCardProps {
  order: Order;
  onPress: (orderId: string) => void;
}
```

Avoid passing dozens of primitive props such as:

```tsx
<OrderCard
  id={...}
  customerName={...}
  orderNumber={...}
  status={...}
  price={...}
  tax={...}
  discount={...}
  table={...}
  ...
/>
```

when passing the domain object is cleaner.

However, do not pass giant unrelated objects when the component only requires one or two values.

Use judgment.

---

# LIMIT PROP DRILLING

Avoid passing the same data through many components solely to reach a deeply nested child.

But do NOT immediately introduce Context or Redux to solve every two-level prop chain.

Example:

```text
Screen
→ Section
→ Item
```

passing props is usually perfectly fine.

For deeply shared feature state, consider:

- feature context
- Redux
- appropriate hook architecture

only when justified.

---

# IMPORT ORGANIZATION

Keep imports readable.

Use a consistent grouping strategy such as:

```typescript
// React / React Native
import React from 'react';
import {View} from 'react-native';

// Third-party
import {useQuery} from '@tanstack/react-query';

// Internal absolute imports
import {AppText} from '@/components/ui/AppText';

// Relative/local imports
import {OrderCard} from './OrderCard';

// Types
import type {Order} from '../types';
```

Configure path aliases where they meaningfully improve readability.

For example:

```text
@/components
@/features
@/services
@/theme
@/utils
```

Avoid extremely long paths such as:

```typescript
../../../../../../components/Button
```

---

# AVOID BARREL-FILE ABUSE

Small controlled `index.ts` exports are acceptable.

Do not create enormous barrel files exporting hundreds of files because they can:

- hide dependencies
- create circular dependencies
- make code navigation harder
- negatively affect tooling/build behaviour

Prefer direct imports where clarity is better.

---

# NO DUPLICATED LOGIC

Before writing new functionality, search the project for existing equivalent logic.

Do not create:

```text
formatPrice()
formatAmount()
formatCurrencyValue()
displayMoney()
```

if they all perform the same task.

Consolidate genuinely identical functionality.

---

# NO COPY-PASTE COMPONENTS

Do not duplicate an entire component and modify two lines.

Create a reusable component if the behaviour is genuinely shared.

However, do not create a huge generic component with dozens of props solely to avoid a small amount of harmless duplication.

Choose readability over forced DRY.

---

# DRY IS NOT THE ONLY GOAL

Do not sacrifice readability to eliminate every repeated line.

Accept small duplication when abstraction would make the code harder to understand.

Priority:

```text
Correctness
↓
Readability
↓
Maintainability
↓
Reuse
↓
Cleverness
```

Cleverness is the lowest priority.

---

# NO CLEVER CODE

Avoid unnecessarily compact code.

Bad:

```typescript
const x = a?.b?.c?.filter(Boolean).reduce((p, c) => p + +c.v, 0) ?? 0;
```

when a clearer implementation would be easier to understand.

Write code another developer can understand quickly.

---

# PREFER BORING, PREDICTABLE CODE

Use standard patterns.

Do not invent custom frameworks inside the project.

Future developers should be able to recognize normal:

- React
- React Native
- TypeScript
- React Navigation
- React Query
- Redux Toolkit

patterns without first learning a custom architecture.

---

# COMMENTS SHOULD EXPLAIN WHY

Do not comment obvious statements.

Bad:

```typescript
// Increment counter
counter += 1;
```

Useful:

```typescript
// The API can return duplicate table events after reconnect.
// Deduplicate by event ID before updating local state.
```

Comments should explain non-obvious reasons and constraints.

---

# KEEP LOGIC NEAR ITS DOMAIN

Order calculations belong around:

```text
features/orders
```

Authentication logic belongs around:

```text
features/auth
```

Employee logic belongs around:

```text
features/employees
```

Do not create a giant:

```text
utils.ts
```

containing unrelated application logic.

---

# UTILITY FILE RULE

Do not create dumping-ground files such as:

```text
helpers.ts
common.ts
utils.ts
functions.ts
misc.ts
```

containing dozens of unrelated methods.

Prefer focused utilities:

```text
currency.ts
date.ts
validation.ts
orderCalculations.ts
image.ts
```

---

# CONSTANT FILE RULE

Avoid one enormous:

```text
constants.ts
```

for the entire application.

Use domain-focused constants where appropriate:

```text
constants/
├── routes.ts
├── storageKeys.ts
├── permissions.ts
└── environment.ts
```

Feature-specific constants should normally stay in their feature.

---

# SERVICES

Services should have focused responsibilities.

Example:

```text
services/
├── api/
├── storage/
├── analytics/
└── monitoring/
```

Avoid:

```text
AppService.ts
```

with thousands of lines handling unrelated functionality.

---

# KEEP API CODE READABLE

Prefer endpoints that clearly describe intent.

Example:

```typescript
export const getRestaurantTables = async (
  restaurantId: RestaurantId,
): Promise<Table[]> => {
  return apiClient.get(`/restaurants/${restaurantId}/tables`);
};
```

Avoid obscure wrappers requiring many layers to understand one HTTP request.

---

# API RESPONSE TRANSFORMATION

If the backend response format differs from application domain models, transform it in the API/data layer.

Do not scatter transformations throughout UI components.

Example:

```typescript
const mapOrderDtoToOrder = (dto: OrderDto): Order => ({
  id: dto.order_id,
  total: dto.total_amount,
  status: dto.order_status,
});
```

Then components receive clean application models.

---

# CODE SHOULD READ LIKE A STORY

High-level functions should make the workflow obvious.

Example:

```typescript
const handleOwnerRegistration = async () => {
  const payload = createOwnerRegistrationPayload(formValues);

  const owner = await registerOwner(payload);

  await saveSession(owner.session);

  initializeAuthenticatedUser(owner);

  navigateToDashboard();
};
```

A developer should understand the process without reading every implementation immediately.

---

# DO NOT HIDE EVERYTHING BEHIND ABSTRACTIONS

Important application behaviour should remain discoverable.

For example, do not create:

```typescript
await executeWorkflow('OWNER_REGISTRATION');
```

if understanding what actually happens requires opening ten generic files.

Prefer explicit domain APIs.

---

# CONSISTENCY

Once patterns are established for:

- API calls
- forms
- navigation
- loading states
- errors
- lists
- modals
- bottom sheets
- styling
- analytics

follow the same pattern throughout the application.

Do not implement the same concept five different ways.

---

# REFACTOR DURING IMPLEMENTATION

After completing each significant feature, review it.

Ask:

```text
Is this screen difficult to understand?

Is one component doing too much?

Is logic duplicated?

Did a shared pattern emerge?

Are names meaningful?

Can another developer find where functionality lives?

Can I understand the main workflow without tracing ten files?
```

Refactor immediately when the answer indicates unnecessary complexity.

Do not postpone all cleanup until the end.

---

# REQUIRED CODE QUALITY CHECK

Before marking a screen or feature complete, inspect it for:

- giant components
- unnecessary components
- excessive nested JSX
- unclear variable names
- unclear function names
- duplicated logic
- giant hooks
- giant services
- magic values
- unnecessary abstractions
- unnecessary libraries
- dead code
- `any`
- excessive comments
- insufficient comments for unusual logic
- avoidable prop drilling
- excessive global state
- unnecessary memoization

Fix them before proceeding.

---

# READABILITY OVER MICRO-OPTIMIZATION

Never reduce code readability for an insignificant theoretical performance improvement.

First:

1. write clear code
2. measure performance
3. locate real bottlenecks
4. optimize those bottlenecks
5. retain clarity wherever possible

Do not preemptively turn straightforward code into complicated optimization logic.

---

# PERFORMANCE COMPONENTIZATION

Componentization can also be used to isolate rendering.

Example:

```tsx
<DashboardScreen>
  <DashboardHeader />
  <TablesSection />
  <ActiveOrdersSection />
</DashboardScreen>
```

If `ActiveOrdersSection` changes frequently, it should not unnecessarily cause expensive unrelated UI to rerender.

Use sensible component boundaries to localize updates.

Again, do not memoize everything blindly.

Profile first.

---

# FINAL COMPONENTIZATION PRINCIPLE

Follow this rule:

```text
Do not ask:

"How many components can I create?"

Ask:

"What component boundaries make this code easiest to understand,
maintain, test, reuse, and optimize?"
```

The final codebase should feel like it was written by an experienced engineer for another engineer to maintain.

A developer unfamiliar with the project should be able to:

1. open a screen
2. understand its high-level structure quickly
3. identify where its business logic lives
4. find its API calls
5. find its types
6. find its reusable UI
7. modify one feature without unexpectedly breaking unrelated features

without needing to reverse engineer the architecture first.