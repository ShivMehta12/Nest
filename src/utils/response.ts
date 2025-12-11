// response.ts
export const response = {
    success: (data: any, message = 'Request successful') => {
      return {
        status: 'success',
        message,
        data,
      };
    },
  
    failed: (message = 'Request failed', data: any = null) => {
      return {
        status: 'failed',
        message,
        data,
      };
    },
  };
  