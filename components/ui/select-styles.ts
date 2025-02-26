export const selectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: 'var(--background)',
    borderColor: 'rgb(226, 232, 240)',
    borderRadius: '0.5rem',
    minHeight: '40px',
    boxShadow: 'none',
    fontSize: '0.875rem',
    '&:hover': {
      borderColor: 'rgb(226, 232, 240)'
    }
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: 'white',
    border: '1px solid rgb(226, 232, 240)',
    borderRadius: '0.5rem',
    boxShadow: '0px 4px 25px 0px rgba(0, 0, 0, 0.10)',
    zIndex: 50,
    marginTop: '4px',
    padding: 0,
    overflow: 'hidden'
  }),
  menuList: (base: any) => ({
    ...base,
    padding: 0
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused 
      ? 'rgb(241, 245, 249)'
      : state.isSelected 
        ? 'rgb(241, 245, 249)'
        : 'white',
    color: 'rgb(15, 23, 42)',
    cursor: 'pointer',
    padding: '10px 16px',
    fontSize: '0.875rem',
    fontWeight: 400,
    ':active': {
      backgroundColor: 'rgb(241, 245, 249)'
    },
    ':first-of-type': {
      borderTopLeftRadius: '0.5rem',
      borderTopRightRadius: '0.5rem'
    },
    ':last-of-type': {
      borderBottomLeftRadius: '0.5rem',
      borderBottomRightRadius: '0.5rem'
    }
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: 'rgb(241, 245, 249)',
    borderRadius: '0.375rem',
    padding: '0 2px',
    margin: '2px'
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: 'rgb(15, 23, 42)',
    padding: '2px 6px',
    fontSize: '0.875rem'
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: 'rgb(15, 23, 42)',
    borderRadius: '0.375rem',
    ':hover': {
      backgroundColor: 'rgb(239, 68, 68)',
      color: 'white'
    },
    padding: '0 4px'
  }),
  placeholder: (base: any) => ({
    ...base,
    color: 'rgb(100, 116, 139)',
    fontSize: '0.875rem'
  }),
  input: (base: any) => ({
    ...base,
    color: 'rgb(15, 23, 42)',
    fontSize: '0.875rem'
  }),
  clearIndicator: (base: any) => ({
    ...base,
    color: 'rgb(100, 116, 139)',
    ':hover': {
      color: 'rgb(15, 23, 42)'
    },
    padding: '2px'
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    color: 'rgb(100, 116, 139)',
    ':hover': {
      color: 'rgb(15, 23, 42)'
    },
    padding: '2px 8px'
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '2px 8px'
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    color: 'rgb(100, 116, 139)',
    backgroundColor: 'white',
    padding: '10px 16px',
    fontSize: '0.875rem'
  })
}; 