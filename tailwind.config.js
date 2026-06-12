/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Active-track / Daily Pick yellow (iOS Color.yellow role).
        accent: '#FFD700',
        // iOS text-selection blue: Color(red: 0.2, green: 0.47, blue: 0.96).
        selection: 'rgb(51, 120, 245)',
        // NEW badge coral: Color(red: 1.0, green: 0.31, blue: 0.27).
        coral: 'rgb(255, 79, 69)',
        // iOS systemGray.
        sysgray: 'rgb(142, 142, 147)',
      },
      fontFamily: {
        p1: ['Paperlogy-1Thin', 'sans-serif'],
        p2: ['Paperlogy-2ExtraLight', 'sans-serif'],
        p3: ['Paperlogy-3Light', 'sans-serif'],
        p4: ['Paperlogy-4Regular', 'sans-serif'],
        p5: ['Paperlogy-5Medium', 'sans-serif'],
        p6: ['Paperlogy-6SemiBold', 'sans-serif'],
        p7: ['Paperlogy-7Bold', 'sans-serif'],
        p8: ['Paperlogy-8ExtraBold', 'sans-serif'],
        p9: ['Paperlogy-9Black', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
