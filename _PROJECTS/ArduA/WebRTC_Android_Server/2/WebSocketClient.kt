package com.example.mytest

import android.annotation.SuppressLint
import android.util.Log
import okhttp3.*
import org.json.JSONObject
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

class WebSocketClient(private val listener: okhttp3.WebSocketListener) {
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)
        .pingInterval(20, TimeUnit.SECONDS)
        .hostnameVerifier { _, _ -> true }
        .sslSocketFactory(getUnsafeSSLSocketFactory(), getTrustAllCerts()[0] as X509TrustManager)
        .build()

    private fun getUnsafeSSLSocketFactory(): SSLSocketFactory {
        val trustAllCerts = getTrustAllCerts()
        val sslContext = SSLContext.getInstance("SSL")
        sslContext.init(null, trustAllCerts, java.security.SecureRandom())
        return sslContext.socketFactory
    }

    private fun getTrustAllCerts(): Array<TrustManager> {
        return arrayOf(
            @SuppressLint("CustomX509TrustManager")
            object : X509TrustManager {
                @SuppressLint("TrustAllX509TrustManager")
                override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {
                }

                @SuppressLint("TrustAllX509TrustManager")
                override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
                }

                override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            })
    }

    fun connect(url: String) {
        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = client.newWebSocket(request, listener)
    }

    fun send(message: String) {
        webSocket?.send(message)
    }

    fun disconnect() {
        webSocket?.close(1000, "Normal closure")
        client.dispatcher.executorService.shutdown()
    }
}