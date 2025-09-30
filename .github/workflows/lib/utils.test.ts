// Unit tests for utility functions

import { cn } from "../../lib/utils"

describe("Utils", () => {
  describe("cn function", () => {
    it("should merge class names", () => {
      const result = cn("class1", "class2")
      expect(result).toBe("class1 class2")
    })

    it("should handle conditional classes", () => {
      const result = cn("base", true && "conditional", false && "excluded")
      expect(result).toBe("base conditional")
    })

    it("should merge Tailwind classes correctly", () => {
      const result = cn("px-2 py-1", "px-4")
      expect(result).toBe("py-1 px-4")
    })

    it("should handle arrays of classes", () => {
      const result = cn(["class1", "class2"], "class3")
      expect(result).toBe("class1 class2 class3")
    })

    it("should handle objects with boolean values", () => {
      const result = cn({
        base: true,
        active: true,
        disabled: false,
      })
      expect(result).toBe("base active")
    })

    it("should handle undefined and null values", () => {
      const result = cn("base", undefined, null, "end")
      expect(result).toBe("base end")
    })

    it("should handle empty inputs", () => {
      const result = cn()
      expect(result).toBe("")
    })
  })
})
