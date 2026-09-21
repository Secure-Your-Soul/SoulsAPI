#define NAPI_VERSION 8
#include <node_api.h>

// Prawdziwa logika w czystym C
napi_value Add(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    
    // Pobierz argumenty z JS
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    double value0, value1;
    napi_get_value_double(env, args[0], &value0);
    napi_get_value_double(env, args[1], &value1);

    // Wykonaj obliczenia
    napi_value sum;
    napi_create_double(env, value0 + value1, &sum);

    return sum;
}

// Rejestracja modułu (to mówi Node.js co eksportujemy)
napi_value Init(napi_env env, napi_value exports) {
    napi_value fn;
    napi_create_function(env, NULL, 0, Add, NULL, &fn);
    napi_set_named_property(env, exports, "add", fn);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)