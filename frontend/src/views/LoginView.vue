<template>
<div class="bg-gray-50">
    <div class="min-h-screen flex flex-col items-center justify-center py-6 px-4">
        <div class="max-w-md w-full">
            <div class="p-8 rounded-2xl bg-white shadow">
            <h2 class="text-slate-900 text-center text-3xl font-semibold">Sign in</h2>
            <form @submit.prevent="login" class="mt-12 space-y-6">
                <div>
                    <label class="text-slate-800 text-sm font-medium mb-2 block">Email</label>
                    <div class="relative flex items-center">
                        <input v-model="email" type="email" class="w-full text-slate-800 text-sm border border-slate-300 px-4 py-3 rounded-md outline-blue-600" placeholder="Email" />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="#bbb" stroke="#bbb" class="w-4 h-4 absolute right-4" viewBox="0 0 24 24">
                        <circle cx="10" cy="7" r="6" data-original="#000000"></circle>
                        <path d="M14 15H6a5 5 0 0 0-5 5 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 5 5 0 0 0-5-5zm8-4h-2.59l.3-.29a1 1 0 0 0-1.42-1.42l-2 2a1 1 0 0 0 0 1.42l2 2a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-.3-.29H22a1 1 0 0 0 0-2z" data-original="#000000"></path>
                        </svg>
                    </div>
                </div>
                <div>
                <label class="text-slate-800 text-sm font-medium mb-2 block">Password</label>
                <div class="relative flex items-center">
                  <input v-model="password" type="password" class="w-full text-slate-800 text-sm border border-slate-300 px-4 py-3 rounded-md outline-blue-600" placeholder="Password" />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="#bbb" stroke="#bbb" class="w-4 h-4 absolute right-4 cursor-pointer" viewBox="0 0 128 128">
                    <path d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z" data-original="#000000"></path>
                  </svg>
                </div>
              </div>
                    
                    <button type="submit" class="w-full py-2 px-4 text-[15px] font-medium tracking-wide rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer">Login</button>
                    
            </form>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import apiClient from '../api/axios';

export default {
  name: 'Auth',
  data() {
    return {
      email: '',
      password: '',
    };
  },
methods: {
  async login() {
    try {
      const response = await apiClient.post('/login', {
        email: this.email,
        password: this.password,
      });

      // Dynamically import jwt-decode
      const jwtDecode = (await import('jwt-decode')).jwtDecode || (await import('jwt-decode')).default || (await import('jwt-decode'));

      // Extract token from the response
      const token = response.data.token;

      // Decode the token to extract client_name
      const decodedToken = jwtDecode(token);
      const clientName = decodedToken.client_name;

      // Store the token and client_name in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('client_name', clientName);

      // blueirect to the home page
      this.$router.push('/Home');
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
    }
  },
},
};
</script>