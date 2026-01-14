import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Personalize seu sistema de leads
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Settings className="h-5 w-5" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            As configurações estarão disponíveis em breve. Aqui você poderá
            gerenciar vendedores, origens, tipos de serviço e outras opções do
            sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
