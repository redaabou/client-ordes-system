<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
    <div class="container mx-auto px-4 py-8">
      <!-- Header with welcome message -->
      <header class="flex justify-between items-center mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h1 class="text-xl font-bold">Welcome, <span class="text-blue-600 dark:text-blue-400">{{ clientName }}</span></h1>
        </div>
        <button 
          @click="logout" 
          class="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </header>

      <!-- Main content -->
      <div class="flex flex-col items-center">
        <!-- File Upload Section -->
        <div v-if="!isLoading && !hasExtractedData" class="w-full max-w-md">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold mb-2">Upload Order PDF</h2>
            <p class="text-gray-600 dark:text-gray-400">Upload your PDF file to extract order information</p>
          </div>
          
          <label
            for="uploadFile1"
            class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 h-64 w-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          >
            <div class="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative flex flex-col items-center">
              <div class="mb-4 p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full group-hover:scale-110 transition-transform duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-10 h-10 text-blue-600 dark:text-blue-400"
                  viewBox="0 0 32 32"
                  fill="currentColor"
                >
                  <path
                    d="M23.75 11.044a7.99 7.99 0 0 0-15.5-.009A8 8 0 0 0 9 27h3a1 1 0 0 0 0-2H9a6 6 0 0 1-.035-12 1.038 1.038 0 0 0 1.1-.854 5.991 5.991 0 0 1 11.862 0A1.08 1.08 0 0 0 23 13a6 6 0 0 1 0 12h-3a1 1 0 0 0 0 2h3a8 8 0 0 0 .75-15.956z"
                  />
                  <path
                    d="M20.293 19.707a1 1 0 0 0 1.414-1.414l-5-5a1 1 0 0 0-1.414 0l-5 5a1 1 0 0 0 1.414 1.414L15 16.414V29a1 1 0 0 0 2 0V16.414z"
                  />
                </svg>
              </div>
              <span class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-1">Upload PDF File</span>
              <p class="text-sm text-gray-500 dark:text-gray-400">Drag and drop or click to browse</p>
              <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2 px-4 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">Only PDF files are allowed</p>
            </div>
            <input type="file" id="uploadFile1" class="hidden" @change="handleFileUpload" accept=".pdf" />
          </label>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="w-full flex flex-col items-center justify-center py-12">
          <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p class="text-lg font-medium text-gray-600 dark:text-gray-300">Processing your document...</p>
        </div>

        <!-- Display Extracted Data - Single Order Format -->
        <div v-if="extractedData && !isMultiOrderFormat" class="w-full max-w-5xl animate-fadeIn">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Order Details</h2>
            <button 
              @click="resetForm" 
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Upload Another
            </button>
          </div>
          
          <!-- Order Summary Card -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Order Number</p>
                <p class="text-lg font-semibold">{{ extractedData.order_number }}</p>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Order Date</p>
                <p class="text-lg font-semibold">{{ extractedData.order_date }}</p>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Delivery Date</p>
                <p class="text-lg font-semibold">{{ extractedData.delivery_date }}</p>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Sales Manager</p>
                <p class="text-lg font-semibold">{{ extractedData.sales_manager }}</p>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg md:col-span-2 lg:col-span-1">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Delivery Address</p>
                <p class="text-lg font-semibold">{{ extractedData.delivery_address }}</p>
              </div>
            </div>
          </div>

          <!-- Products Table -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold">Products</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-50 dark:bg-gray-700">
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Packaging</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit Price</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pack Price</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="(product, index) in extractedData.products" :key="index" 
                      class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ product.code }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.description }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.quantity }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.packaging }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.unit_price }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.pack_price }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ product.amount }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Totals Card -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold">Order Totals</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total HT</p>
                  <p class="text-xl font-bold">{{ extractedData.total_ht }}</p>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total TVA</p>
                  <p class="text-xl font-bold">{{ extractedData.total_tva }}</p>
                </div>
                <div class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p class="text-sm text-blue-600 dark:text-blue-400 mb-1">Total TTC</p>
                  <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ extractedData.total_ttc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Display Extracted Data - Multi-Order Format -->
        <div v-if="multiOrderData && multiOrderData.length > 0" class="w-full max-w-5xl animate-fadeIn">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Orders ({{ multiOrderData.length }})</h2>
            <button 
              @click="resetForm" 
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Upload Another
            </button>
          </div>

          <!-- Order Accordion -->
          <div v-for="(order, orderIndex) in multiOrderData" :key="orderIndex" class="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <!-- Order Header -->
            <div 
              class="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
              @click="toggleOrderExpanded(orderIndex)"
            >
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                  <div class="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold">Order #{{ order.order_number }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ order.order_date }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <div class="text-right">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p class="font-bold">{{ order.total_ttc }} MAD</p>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-5 w-5 transition-transform duration-200" 
                    :class="expandedOrders[orderIndex] ? 'transform rotate-180' : ''"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Order Details (Collapsible) -->
            <div v-if="expandedOrders[orderIndex]" class="animate-fadeIn">
              <!-- Order Summary Card -->
              <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Delivery Address</p>
                    <p class="text-lg font-semibold">{{ order.delivery_address }}</p>
                  </div>
                  <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Responsible</p>
                    <p class="text-lg font-semibold">{{ order.sales_manager }}</p>
                  </div>
                </div>
              </div>

              <!-- Products Table -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="bg-gray-50 dark:bg-gray-700">
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Barcode</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit Price</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pack Price</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discount</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="(product, index) in order.products" :key="index" 
                        class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ product.code }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.description }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.codeBarre }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.quantity }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.unit_price }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.pack_price }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">{{ product.discount }}%</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ product.amount }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

          

              <!-- Order Total -->
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold">Order Totals</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total HT</p>
                  <p class="text-xl font-bold">{{ order.total_ht }}</p>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total TVA</p>
                  <p class="text-xl font-bold">{{order.total_tva}}</p>
                </div>
                <div class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p class="text-sm text-blue-600 dark:text-blue-400 mb-1">Total TTC</p>
                  <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{order.total_ttc}}</p>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Home',
  data() {
    return {
      clientName: localStorage.getItem('client_name') || 'Guest',
      extractedData: null,
      multiOrderData: null,
      isLoading: false,
      isMultiOrderFormat: false,
      expandedOrders: {}
    };
  },
  computed: {
    hasExtractedData() {
      return this.extractedData !== null || (this.multiOrderData !== null && this.multiOrderData.length > 0);
    }
  },
  methods: {
    logout() {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('client_name');
      
      // Redirect to login page
      window.location.href = '/';
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) {
        alert('Please select a file.');
        return;
      }

      if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed.');
        return;
      }

      const formData = new FormData();
      formData.append('pdf', file);

      // Retrieve the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Please log in to upload files.');
        return;
      }

      this.isLoading = true;

      try {
        const response = await axios.post('http://localhost:3000/order', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });

        // Detect data format and process accordingly
        this.processResponseData(response.data);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to extract data from the PDF.');
      } finally {
        this.isLoading = false;
      }
    },

    processResponseData(responseData) {
      // Check if the response has the multi-order format
      if (responseData.data && Array.isArray(responseData.data.orders)) {
        
        this.isMultiOrderFormat = true;
        this.multiOrderData = responseData.data.orders;
        
        // Initialize all orders as collapsed
        this.expandedOrders = {};
        this.multiOrderData.forEach((_, index) => {
          this.expandedOrders[index] = index === 0; // Expand only the first order
        });
      } else {
        // Original single order format
        this.isMultiOrderFormat = false;
        this.extractedData = responseData.data;
        this.multiOrderData = null;
      }
    },

    toggleOrderExpanded(orderIndex) {
      this.expandedOrders[orderIndex] = !this.expandedOrders[orderIndex];
      this.$forceUpdate(); // Force Vue to update the UI
    },

    calculateOrderTotal(products) {
      if (!products || !products.length) return '0.00';
      
      const total = products.reduce((sum, product) => {
        const amount = parseFloat(product.montant) || 0;
        return sum + amount;
      }, 0);
      
      return total.toFixed(2);
    },

    resetForm() {
      this.extractedData = null;
      this.multiOrderData = null;
      this.isMultiOrderFormat = false;
      // Reset the file input
      const fileInput = document.getElementById('uploadFile1');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  },
};
</script>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
</style>
