import { Derived, Store } from '@tanstack/store'

export const store = new Store({
  firstName: 'Jane',
  lastName: 'Smith',
})

export const fullName = new Derived({
  fn: () => `${store.state.firstName} ${store.state.lastName}`,
  deps: [store],
})

fullName.mount()
