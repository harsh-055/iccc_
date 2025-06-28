"use client"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApi } from "@/lib/secure-fetcher/client"
import { loginAction, registerAction } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Component() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  
  const [loginState, fetchLogin] = useApi(loginAction, {
    onSuccess: () => {
      console.log("Login successful");
      router.push("/dashboard"); // Redirect after successful login
    },
    onError: (error) => {
      console.error("Login failed:", error);
    }
  });

  const [registerState, fetchRegister] = useApi(registerAction, {
    onSuccess: () => {
      console.log("Registration successful");
      router.push("/dashboard"); // Redirect after successful registration
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    }
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchLogin({ email, password })
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchRegister({ name, email, password })
  }

  return (
    <Card className="mx-auto max-w-sm">
      <Tabs defaultValue="login">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Account Access</CardTitle>
            <TabsList>
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
          </div>
          <CardDescription>Manage your account access</CardDescription>
        </CardHeader>
        <CardContent>
          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {loginState.error && (
                <div className="text-red-500 text-sm">{loginState.error}</div>
              )}
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginState.isLoading}
              >
                {loginState.isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input 
                  id="register-email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input 
                  id="register-password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {registerState.error && (
                <div className="text-red-500 text-sm">{registerState.error}</div>
              )}
              <Button 
                type="submit" 
                className="w-full"
                disabled={registerState.isLoading}
              >
                {registerState.isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}