// Example token data for testing and demonstration
const ExampleTokens = {
  simple: {
    colors: {
      primary: {
        "$value": "#DF2AA9",
        "$type": "color",
        "$description": "Primary brand color"
      },
      secondary: {
        "$value": "#6C7B8A",
        "$type": "color", 
        "$description": "Secondary color"
      },
      success: {
        "$value": "#22C55E",
        "$type": "color",
        "$description": "Success state color"
      },
      error: {
        "$value": "#EF4444",
        "$type": "color",
        "$description": "Error state color"
      }
    },
    spacing: {
      xs: {
        "$value": "4px",
        "$type": "dimension",
        "$description": "Extra small spacing"
      },
      sm: {
        "$value": "8px", 
        "$type": "dimension",
        "$description": "Small spacing"
      },
      md: {
        "$value": "16px",
        "$type": "dimension", 
        "$description": "Medium spacing"
      },
      lg: {
        "$value": "24px",
        "$type": "dimension",
        "$description": "Large spacing"
      },
      xl: {
        "$value": "32px",
        "$type": "dimension",
        "$description": "Extra large spacing"
      }
    },
    typography: {
      fontFamily: {
        primary: {
          "$value": "Raleway, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          "$type": "fontFamily",
          "$description": "Primary font family"
        },
        mono: {
          "$value": "'Courier New', monospace",
          "$type": "fontFamily",
          "$description": "Monospace font family"
        }
      },
      fontSize: {
        xs: {
          "$value": "12px",
          "$type": "dimension",
          "$description": "Extra small font size"
        },
        sm: {
          "$value": "14px",
          "$type": "dimension",
          "$description": "Small font size"
        },
        md: {
          "$value": "16px",
          "$type": "dimension",
          "$description": "Base font size"
        },
        lg: {
          "$value": "18px", 
          "$type": "dimension",
          "$description": "Large font size"
        },
        xl: {
          "$value": "20px",
          "$type": "dimension",
          "$description": "Extra large font size"
        }
      }
    }
  },

  multiTheme: {
    colors: {
      primary: {
        "$value": {
          "light": "#DF2AA9",
          "dark": "#E63EC4",
          "high-contrast": "#FF00AA"
        },
        "$type": "color",
        "$description": "Primary brand color across themes"
      },
      background: {
        primary: {
          "$value": {
            "light": "#FFFFFF", 
            "dark": "#1A1A1A",
            "high-contrast": "#000000"
          },
          "$type": "color",
          "$description": "Primary background color"
        },
        secondary: {
          "$value": {
            "light": "#F5F5F5",
            "dark": "#2C2C2C", 
            "high-contrast": "#1A1A1A"
          },
          "$type": "color",
          "$description": "Secondary background color"
        }
      },
      text: {
        primary: {
          "$value": {
            "light": "#000000",
            "dark": "#FFFFFF",
            "high-contrast": "#FFFFFF"
          },
          "$type": "color",
          "$description": "Primary text color"
        },
        secondary: {
          "$value": {
            "light": "#6C7B8A",
            "dark": "#A0AEC0",
            "high-contrast": "#CCCCCC"
          },
          "$type": "color",
          "$description": "Secondary text color"
        }
      }
    },
    spacing: {
      xs: {
        "$value": "4px",
        "$type": "dimension"
      },
      sm: {
        "$value": "8px",
        "$type": "dimension"
      },
      md: {
        "$value": "16px", 
        "$type": "dimension"
      },
      lg: {
        "$value": "24px",
        "$type": "dimension"
      },
      xl: {
        "$value": "32px",
        "$type": "dimension"
      },
      xxl: {
        "$value": "48px",
        "$type": "dimension"
      }
    },
    borderRadius: {
      sm: {
        "$value": "4px",
        "$type": "dimension",
        "$description": "Small border radius"
      },
      md: {
        "$value": "8px", 
        "$type": "dimension",
        "$description": "Medium border radius"
      },
      lg: {
        "$value": "12px",
        "$type": "dimension",
        "$description": "Large border radius"
      },
      full: {
        "$value": "9999px",
        "$type": "dimension", 
        "$description": "Full border radius"
      }
    },
    shadows: {
      sm: {
        "$value": {
          "light": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          "dark": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
          "high-contrast": "0 1px 2px 0 rgba(0, 0, 0, 0.8)"
        },
        "$type": "shadow",
        "$description": "Small shadow"
      },
      md: {
        "$value": {
          "light": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
          "dark": "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)",
          "high-contrast": "0 4px 6px -1px rgba(0, 0, 0, 0.8), 0 2px 4px -2px rgba(0, 0, 0, 0.8)"
        },
        "$type": "shadow", 
        "$description": "Medium shadow"
      },
      lg: {
        "$value": {
          "light": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
          "dark": "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
          "high-contrast": "0 10px 15px -3px rgba(0, 0, 0, 0.9), 0 4px 6px -4px rgba(0, 0, 0, 0.9)"
        },
        "$type": "shadow",
        "$description": "Large shadow" 
      }
    },
    typography: {
      fontFamily: {
        primary: {
          "$value": "Raleway, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          "$type": "fontFamily"
        },
        mono: {
          "$value": "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
          "$type": "fontFamily"
        }
      },
      fontSize: {
        xs: {
          "$value": "12px",
          "$type": "dimension"
        },
        sm: {
          "$value": "14px", 
          "$type": "dimension"
        },
        md: {
          "$value": "16px",
          "$type": "dimension"
        },
        lg: {
          "$value": "18px",
          "$type": "dimension"
        },
        xl: {
          "$value": "20px",
          "$type": "dimension"
        },
        "2xl": {
          "$value": "24px",
          "$type": "dimension"
        },
        "3xl": {
          "$value": "30px",
          "$type": "dimension"
        }
      },
      fontWeight: {
        light: {
          "$value": "300",
          "$type": "fontWeight"
        },
        normal: {
          "$value": "400",
          "$type": "fontWeight"
        },
        medium: {
          "$value": "500",
          "$type": "fontWeight"
        },
        semibold: {
          "$value": "600",
          "$type": "fontWeight"
        },
        bold: {
          "$value": "700",
          "$type": "fontWeight"
        }
      },
      lineHeight: {
        tight: {
          "$value": "1.25",
          "$type": "number"
        },
        normal: {
          "$value": "1.5",
          "$type": "number"
        },
        relaxed: {
          "$value": "1.75",
          "$type": "number"
        }
      }
    }
  }
};

// Token Studio format example (will be converted to W3C format internally)
const TokenStudioExample = {
  global: {
    primary: {
      value: "#DF2AA9",
      type: "color"
    },
    secondary: {
      value: "#6C7B8A",
      type: "color"
    },
    spacing: {
      sm: {
        value: "8",
        type: "spacing"
      },
      md: {
        value: "16", 
        type: "spacing"
      },
      lg: {
        value: "24",
        type: "spacing"
      }
    },
    typography: {
      heading: {
        value: {
          fontFamily: "Raleway",
          fontWeight: "700",
          fontSize: "24"
        },
        type: "typography"
      }
    }
  },
  "$themes": [
    {
      id: "light",
      name: "Light Theme",
      selectedTokenSets: {
        global: "enabled"
      }
    },
    {
      id: "dark", 
      name: "Dark Theme",
      selectedTokenSets: {
        global: "enabled"
      }
    }
  ],
  "$metadata": {
    tokenSetOrder: ["global"]
  }
};

// Export for use in main.js
window.ExampleTokens = ExampleTokens;
window.TokenStudioExample = TokenStudioExample;