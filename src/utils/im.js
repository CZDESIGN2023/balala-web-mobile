window.IM = {
  url: 'http://43.135.97.172:8010/platform_login/get_chat_token?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpcCI6MzA4NjYzMDUzMCwiZXhwIjoxNzE5OTYzMDg1LCJteXZlciI6IjEuMi4wKzI2IiwidWlkIjoyMiwicGtnIjoiY2hhdC5jb20uaW0iLCJvcyI6Im1hY29zIiwiaWF0IjoxNzE5MTU2Njg1fQ.PjSn6rB-WNtewpPTmBfUoEQDI3eegwbsjiKx5OTFSYU&auto=1',
  send(url) {
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .catch((error) => {
        console.error('Fetching data error:', error)
        throw error
      })
  },
  getToken(pfcode, onSuccess, onFaild) {
    this.send(`${this.url}&pf_code=${pfcode}`)
      .then((result) => {
        if (result.code === 0) {
          onSuccess(result.data)
        }
        else {
          if (onFaild) {
            onFaild(`errr${result.code}`)
          }
        }
      })
      .catch((error) => {
        if (onFaild) {
          onFaild(error)
        }
      })
  },
}
