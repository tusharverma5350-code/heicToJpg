package com.heicconverter;

/**
 * Immutable result returned by ConvertService for each file.
 */
public class ConversionResult {

    public final boolean success;
    public final String  name;
    public final String  data;    // base64 JPEG, null on failure
    public final String  error;   // error message, null on success

    public ConversionResult(boolean success, String name, String data, String error) {
        this.success = success;
        this.name    = name;
        this.data    = data;
        this.error   = error;
    }

    public java.util.Map<String, Object> toMap() {
        java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("success", success);
        m.put("name",    name);
        if (success) m.put("data",    data);
        else         m.put("details", error);
        return m;
    }
}
