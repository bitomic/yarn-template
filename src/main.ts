import fetch from 'node-fetch'
import fs from 'fs'
import { nanoid } from 'nanoid'
import { parse } from 'node-html-parser'

( async () => {
    const url = 'http://ri.uacj.mx/vufind/Search/Results?type=AllFields&filter%5B%5D=format%3A%22Trabajo+recepcional+licenciatura%22'
    const req = await fetch( url )
    const parsed = parse( await req.text() )

    const links = parsed.querySelectorAll( '.result a.title' )
    for ( const link of links ) {
        const href = link.getAttribute( 'href' )
        const recordUrl = new URL(href ?? '', 'http://ri.uacj.mx').href
        
        const recordReq = await fetch( recordUrl )
        const record = parse( await recordReq.text() )
        const documentUrl = record.querySelectorAll( '.table a' ).find( i => i.getAttribute( 'href' )?.startsWith( 'http://hdl.handle.net' ) )?.getAttribute( 'href' )
        if ( !documentUrl ) continue
        const documentReq = await fetch( documentUrl )
        const document = parse( await documentReq.text() )
        const pdfLink = document.querySelector( 'div.col-sm-12:nth-child(2) > div:nth-child(1) > div:nth-child(2) > a:nth-child(1)' )?.getAttribute( 'href' )
        if ( !pdfLink ) continue
        const pdfUrl = new URL( pdfLink, 'http://erecursos.uacj.mx' ).href

        const id = nanoid()
        
        const t1 = Date.now()
        const pdfReq = await fetch( pdfUrl )
        const pdf = Buffer.from( await pdfReq.arrayBuffer() )

        const t2 = Date.now()
        fs.writeFileSync( `documents/${ id }.pdf`, pdf )
        const t3 = Date.now()
        console.log( [ id, t2 - t1, t3 - t2, t3 - t1 ] )
    }
} )()