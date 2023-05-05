export const isDark = useDark({
  onChanged(dark: boolean) {
    if (dark) {
      // 设置为暗黑主题
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      document.body.setAttribute('arco-theme', 'dark')
    }
    else {
      // 恢复亮色主题
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      document.body.removeAttribute('arco-theme')
    }
  },
})
export const toggleDark = useToggle(isDark)
